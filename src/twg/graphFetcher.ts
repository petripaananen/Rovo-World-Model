/**
 * Rovo-World-Model — Jira + Atlassian Teamwork Graph (TWG) Extractor (`src/twg/graphFetcher.ts`)
 *
 * Queries available Jira projects (`/rest/api/3/project/search`) and active Jira project issues
 * & `issueLinks` (`Blocks`, `Depends on`, `Architectural Decision`), enriching nodes with
 * Atlassian Teamwork Graph Goals & Teams.
 */

import { addCalendarDays, buildDAGFromJiraIssues } from '../engine/dag';
import { CausalGraph, RawJiraIssue, TeamMetadata, TeamworkGoal } from '../engine/types';
import {
  buildChronosGoals,
  CHRONOS_DEFAULT_REFERENCE_DATE,
  getChronosSyntheticGraph,
} from './syntheticSeeder';

export interface JiraProjectSummary {
  id: string;
  key: string;
  name: string;
}

/**
 * GraphQL query for Atlassian Teamwork Graph (Townsquare Goals + Teams + Jira Issue Links).
 */
export const TWG_GOALS_AND_TEAMS_GRAPHQL_QUERY = `
  query ProjectWorldModelTeamworkGraph($cloudId: ID!, $projectKey: String!) {
    jira {
      project(cloudId: $cloudId, key: $projectKey) {
        id
        key
        name
      }
    }
    graphStore @optIn(to: "GraphStore") {
      projectGoalsAndDecisions: cypherQuery(
        query: "MATCH (p:JiraProject)-[:HAS_ISSUE]->(i:JiraIssue)-[:CONTRIBUTES_TO]->(g:TownsquareGoal) OPTIONAL MATCH (i)-[:DOCUMENTED_IN]->(c:ConfluencePage) RETURN i.key, g.id, g.name, g.targetDate, g.status, c.id, c.title"
      ) {
        edges {
          node {
            columns {
              key
              value
            }
          }
        }
      }
    }
  }
`;

export interface LoadGraphOptions {
  projectKey?: string;
  forceDemo?: boolean;
  referenceDate?: string;
  cloudId?: string;
  authMode?: 'user' | 'app';
  availableProjects?: JiraProjectSummary[];
}

interface JiraHttpResponse {
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
}

/**
 * Invokes Jira REST API using explicit authorization mode:
 * - `'user'` (Custom UI & Rovo): strictly executes `api.asUser()` and NEVER escalates to `api.asApp()`.
 * - `'app'` (authenticated MCP server): executes `api.asApp()`.
 */
async function requestJiraAuthorized(
  forgeApi: typeof import('@forge/api'),
  routeUrl: ReturnType<typeof import('@forge/api').route>,
  authMode: 'user' | 'app' = 'user'
): Promise<JiraHttpResponse> {
  const api = forgeApi.default;
  if (authMode === 'app') {
    return api.asApp().requestJira(routeUrl, {
      headers: { Accept: 'application/json' },
    }) as Promise<JiraHttpResponse>;
  }
  return api.asUser().requestJira(routeUrl, {
    headers: { Accept: 'application/json' },
  }) as Promise<JiraHttpResponse>;
}

/**
 * Fetches all available Jira projects on the user's Atlassian Cloud site.
 */
export async function fetchAvailableJiraProjects(
  authMode: 'user' | 'app' = 'user'
): Promise<JiraProjectSummary[]> {
  try {
    const forgeApi = await import('@forge/api');
    const { route } = forgeApi;

    const response = await requestJiraAuthorized(
      forgeApi,
      route`/rest/api/3/project/search?maxResults=50`,
      authMode
    );

    if (response.ok) {
      const payload = (await response.json()) as {
        values?: Array<{ id?: string; key?: string; name?: string }>;
      };
      const projects = (payload.values ?? [])
        .filter((p) => p.key && p.name)
        .map((p) => ({
          id: String(p.id || p.key),
          key: String(p.key).toUpperCase(),
          name: String(p.name),
        }));

      if (projects.length > 0) {
        return projects;
      }
    }
  } catch {
    // Offline / local unit test fallback
  }

  return [{ id: 'CHRON', key: 'CHRON', name: 'Project Chronos (Demo Snapshot)' }];
}

async function readStoredSnapshot(projectKey: string): Promise<CausalGraph | null> {
  try {
    const forgeApi = await import('@forge/api');
    if (forgeApi?.storage?.get) {
      const stored = (await forgeApi.storage.get(`pwm:graph:${projectKey}`)) as
        | CausalGraph
        | undefined;
      if (stored && Array.isArray(stored.nodes) && stored.nodes.length > 0) {
        return stored;
      }
    }
  } catch {
    // Ignore storage read errors outside Forge runtime
  }
  return null;
}

/**
 * Fetches and builds the `CausalGraph` for a Jira project:
 * 1. If `forceDemo` is explicitly true, returns stored or fresh synthetic graph (`isSyntheticDemo: true`).
 * 2. Queries live Jira issues + `issuelinks` with pagination (up to 250 issues) using strict `authMode`.
 * 3. Propagates `401`/`403` permission failures without falling back to `asApp()`.
 * 4. Falls back to the synthetic graph only when running offline in local unit tests or when the project has 0 issues.
 */
export async function fetchProjectCausalGraph(
  options: LoadGraphOptions = {}
): Promise<CausalGraph> {
  const demoReferenceDate = options.referenceDate || CHRONOS_DEFAULT_REFERENCE_DATE;
  const liveReferenceDate =
    options.referenceDate || new Date().toISOString().slice(0, 10);
  const authMode = options.authMode ?? 'user';

  if (options.forceDemo) {
    const demoKey = (options.projectKey || 'CHRON').trim().toUpperCase() || 'CHRON';
    const stored = await readStoredSnapshot(demoKey);
    return stored ?? getChronosSyntheticGraph(demoKey, demoReferenceDate);
  }

  let accessDeniedError: Error | null = null;

  try {
    const forgeApi = await import('@forge/api');
    const { route } = forgeApi;

    const availableProjects =
      options.availableProjects && options.availableProjects.length > 0
        ? options.availableProjects
        : await fetchAvailableJiraProjects(authMode);

    let projectKey = (options.projectKey || '').trim().toUpperCase();

    if (!projectKey || projectKey === 'CHRON') {
      const matchedReal = availableProjects.find((p) => p.key !== 'CHRON');
      if (matchedReal) {
        projectKey = matchedReal.key;
      } else {
        projectKey = projectKey || 'CHRON';
      }
    }

    const safeProjectKey = /^[A-Z][A-Z0-9_]*$/.test(projectKey)
      ? projectKey
      : 'CHRON';
    const projectMeta = availableProjects.find((p) => p.key === safeProjectKey);
    const projectName = projectMeta ? projectMeta.name : `${safeProjectKey} Project`;

    const fields =
      'summary,status,issuelinks,assignee,timetracking,duedate,resolutiondate,issuetype,timeoriginalestimate,timeestimate,timespent,customfield_10016,customfield_10001,customfield_10021,components,labels,parent,subtasks';

    const MAX_ISSUES = 250;
    const issues: RawJiraIssue[] = [];
    let nextPageToken: string | undefined;
    let jqlSuccess = false;
    let useLegacySearch = false;

    for (let page = 0; page < 3; page++) {
      const routeUrl = nextPageToken
        ? route`/rest/api/3/search/jql?jql=project="${safeProjectKey}" ORDER BY created ASC&fields=${fields}&maxResults=100&nextPageToken=${nextPageToken}`
        : route`/rest/api/3/search/jql?jql=project="${safeProjectKey}" ORDER BY created ASC&fields=${fields}&maxResults=100`;

      const response = await requestJiraAuthorized(forgeApi, routeUrl, authMode);
      if (response.status === 401 || response.status === 403) {
        accessDeniedError = new Error(
          `Jira project access denied (${response.status}) for current user on ${safeProjectKey}`
        );
        break;
      }
      if (!response.ok) {
        if (page === 0) useLegacySearch = true;
        break;
      }

      jqlSuccess = true;
      const payload = (await response.json()) as {
        issues?: RawJiraIssue[];
        nextPageToken?: string;
        isLast?: boolean;
      };
      const batch = payload.issues ?? [];
      issues.push(...batch);
      if (
        !payload.nextPageToken ||
        payload.isLast ||
        batch.length === 0 ||
        issues.length >= MAX_ISSUES
      ) {
        break;
      }
      nextPageToken = payload.nextPageToken;
    }

    if (!accessDeniedError && useLegacySearch) {
      let startAt = 0;
      for (let page = 0; page < 3; page++) {
        const response = await requestJiraAuthorized(
          forgeApi,
          route`/rest/api/3/search?jql=project="${safeProjectKey}" ORDER BY created ASC&fields=${fields}&maxResults=100&startAt=${startAt}`,
          authMode
        );
        if (response.status === 401 || response.status === 403) {
          accessDeniedError = new Error(
            `Jira project access denied (${response.status}) for current user on ${safeProjectKey}`
          );
          break;
        }
        if (!response.ok) break;
        jqlSuccess = true;
        const payload = (await response.json()) as {
          issues?: RawJiraIssue[];
          total?: number;
        };
        const batch = payload.issues ?? [];
        issues.push(...batch);
        startAt += batch.length;
        if (
          batch.length === 0 ||
          issues.length >= MAX_ISSUES ||
          (typeof payload.total === 'number' && startAt >= payload.total)
        ) {
          break;
        }
      }
    }

    if (accessDeniedError) {
      throw accessDeniedError;
    }

    if (jqlSuccess) {
      if (issues.length >= 1) {
        const slicedIssues = issues.slice(0, MAX_ISSUES);
        const allowedIssueKeys = new Set(
          slicedIssues.map((iss) => iss.key.toUpperCase())
        );
        const { goals, teams, issueGoalMap, issueConfluenceMap } =
          await fetchTeamworkGraphMetadata(
            forgeApi,
            safeProjectKey,
            projectName,
            liveReferenceDate,
            options.cloudId,
            authMode,
            allowedIssueKeys
          );
        const dag = buildDAGFromJiraIssues(
          safeProjectKey,
          slicedIssues,
          goals,
          teams,
          liveReferenceDate
        );

        const validGoalIds = new Set(dag.goals.map((g) => g.id));
        const enrichedNodes = dag.nodes.map((node) => {
          const upperKey = node.key.toUpperCase();
          const mappedGoalId = issueGoalMap[upperKey];
          const mappedConfluence = issueConfluenceMap[upperKey];
          if (!mappedGoalId && !mappedConfluence) {
            return node;
          }
          return {
            ...node,
            ...(mappedGoalId && validGoalIds.has(mappedGoalId)
              ? { goalId: mappedGoalId }
              : {}),
            ...(mappedConfluence && !node.confluenceDecision
              ? { confluenceDecision: mappedConfluence }
              : {}),
          };
        });

        return {
          ...dag,
          nodes: enrichedNodes,
          projectName,
          isSyntheticDemo: false,
        };
      }

      const stored = await readStoredSnapshot(safeProjectKey);
      if (stored) {
        return stored;
      }
    }
  } catch (err) {
    if (accessDeniedError) {
      throw accessDeniedError;
    }
    console.info(
      `[PWM GraphFetcher] Using synthetic causal snapshot (${err instanceof Error ? err.message : 'offline/demo mode'}).`
    );
  }

  const fallbackKey =
    (options.projectKey || 'CHRON').trim().toUpperCase() || 'CHRON';
  const storedFallback = await readStoredSnapshot(fallbackKey);
  return storedFallback ?? getChronosSyntheticGraph(fallbackKey, demoReferenceDate);
}

/**
 * Alias for `fetchProjectCausalGraph` for backwards compatibility.
 */
export const loadProjectWorldModelGraph = fetchProjectCausalGraph;

/**
 * Queries Atlassian Teamwork Graph via GraphQL (`api.asApp().requestGraph`) for
 * Townsquare Goals and Atlassian Teams, falling back cleanly to project-aligned TWG metadata.
 */
function computeDayOffsetFromDates(referenceDate: string, targetDate: string, fallbackDays: number): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return fallbackDays;
  const refMs = Date.parse(`${referenceDate.slice(0, 10)}T00:00:00.000Z`);
  const tgtMs = Date.parse(`${targetDate.slice(0, 10)}T00:00:00.000Z`);
  if (!Number.isFinite(refMs) || !Number.isFinite(tgtMs)) return fallbackDays;
  return Math.max(1, Math.round((tgtMs - refMs) / 86400000));
}

export interface TwgGraphEdgeRow {
  node?: {
    columns?: Array<{ key?: string; value?: string }>;
  };
}

export interface ParsedTwgMetadata {
  goals: TeamworkGoal[];
  issueGoalMap: Record<string, string>;
  issueConfluenceMap: Record<string, { id: string; title: string; spaceKey: string }>;
}

function normalizeTwgGoalStatus(raw?: string): TeamworkGoal['status'] {
  const s = (raw ?? '').trim().toLowerCase();
  if (s.includes('off') || s.includes('behind') || s.includes('red')) {
    return 'Off Track';
  }
  if (s.includes('risk') || s.includes('amber') || s.includes('yellow') || s.includes('warn')) {
    return 'At Risk';
  }
  return 'On Track';
}

/**
 * Parses Atlassian Teamwork Graph Cypher rows (`i.key`, `g.id`, `g.name`, `g.targetDate`, `g.status`,
 * `c.id`, `c.title`) into structured Townsquare goals, issue-to-goal mappings, and Confluence ADRs.
 */
export function parseTeamworkGraphEdges(
  rawEdges: TwgGraphEdgeRow[],
  options: {
    referenceDate: string;
    sprintOffset?: number;
    releaseOffset?: number;
    defaultTeams?: TeamMetadata[];
    allowedIssueKeys?: Set<string>;
  }
): ParsedTwgMetadata {
  const sprintOffset = options.sprintOffset ?? 24;
  const releaseOffset = options.releaseOffset ?? 43;
  const parsedGoals = new Map<string, TeamworkGoal>();
  const issueGoalMap: Record<string, string> = {};
  const issueConfluenceMap: Record<
    string,
    { id: string; title: string; spaceKey: string }
  > = {};

  for (const edge of rawEdges) {
    const cols = edge?.node?.columns ?? [];
    const colMap = new Map<string, string>();
    for (const c of cols) {
      if (c.key && c.value) colMap.set(c.key, c.value);
    }

    const iKeyRaw = colMap.get('i.key')?.trim();
    const issueKey = iKeyRaw ? iKeyRaw.toUpperCase() : undefined;

    // Enforce project scoping: skip rows belonging to issues outside the fetched Jira project
    if (
      options.allowedIssueKeys &&
      options.allowedIssueKeys.size > 0 &&
      (!issueKey || !options.allowedIssueKeys.has(issueKey))
    ) {
      continue;
    }

    const gId = colMap.get('g.id')?.trim();
    const gName = colMap.get('g.name')?.trim();

    if (gId && gName && !parsedGoals.has(gId)) {
      const goalIdx = parsedGoals.size;
      const fallbackOffset = goalIdx === 0 ? sprintOffset : releaseOffset;
      const rawTargetDate = colMap.get('g.targetDate')?.trim() || '';
      const validIsoTargetDate = /^\d{4}-\d{2}-\d{2}$/.test(rawTargetDate)
        ? rawTargetDate
        : '';
      const offset = computeDayOffsetFromDates(
        options.referenceDate,
        validIsoTargetDate,
        fallbackOffset
      );
      const ownerTeam =
        options.defaultTeams && options.defaultTeams.length > 0
          ? options.defaultTeams[goalIdx % options.defaultTeams.length].name
          : 'Platform & Delivery';

      parsedGoals.set(gId, {
        id: gId,
        key: gId,
        name: gName,
        targetDate:
          validIsoTargetDate || addCalendarDays(options.referenceDate, offset),
        targetDayOffset: offset,
        ownerTeam,
        status: normalizeTwgGoalStatus(colMap.get('g.status')),
      });
    }

    if (issueKey && gId) {
      issueGoalMap[issueKey] = gId;
    }

    const cId = colMap.get('c.id')?.trim();
    const cTitle = colMap.get('c.title')?.trim();
    if (issueKey && cId && cTitle) {
      issueConfluenceMap[issueKey] = {
        id: cId,
        title: cTitle,
        spaceKey: 'TWG',
      };
    }
  }

  return {
    goals: Array.from(parsedGoals.values()),
    issueGoalMap,
    issueConfluenceMap,
  };
}

async function fetchTeamworkGraphMetadata(
  forgeApi: typeof import('@forge/api'),
  projectKey: string,
  projectName: string,
  referenceDate: string,
  cloudId?: string,
  authMode: 'user' | 'app' = 'user',
  allowedIssueKeys?: Set<string>
): Promise<{
  goals: TeamworkGoal[];
  teams: TeamMetadata[];
  issueGoalMap: Record<string, string>;
  issueConfluenceMap: Record<string, { id: string; title: string; spaceKey: string }>;
}> {
  const chronosDefaults = buildChronosGoals(referenceDate);
  const sprintOffset = chronosDefaults[0]?.targetDayOffset ?? 24;
  const releaseOffset = chronosDefaults[1]?.targetDayOffset ?? 43;

  const defaultGoals: TeamworkGoal[] = [
    {
      id: 'GOAL-ALPHA',
      key: `${projectKey}-GOAL-1`,
      name: `${projectName} Sprint Delivery`,
      targetDate: addCalendarDays(referenceDate, sprintOffset),
      targetDayOffset: sprintOffset,
      ownerTeam: `${projectName} Engineering`,
      status: 'On Track',
    },
    {
      id: 'GOAL-OMEGA',
      key: `${projectKey}-GOAL-2`,
      name: `${projectName} Release Milestone`,
      targetDate: addCalendarDays(referenceDate, releaseOffset),
      targetDayOffset: releaseOffset,
      ownerTeam: 'Platform & Delivery',
      status: 'On Track',
    },
  ];

  const defaultTeams: TeamMetadata[] = [
    {
      id: 'team-1',
      name: `${projectName} Engineering`,
      lead: 'Project Lead',
      color: '#0C66E4',
      cognitiveLoad: 68,
    },
    {
      id: 'team-2',
      name: 'Platform & Cloud Infra',
      lead: 'Tech Lead',
      color: '#1F845A',
      cognitiveLoad: 62,
    },
    {
      id: 'team-3',
      name: 'Product & Client UI',
      lead: 'Frontend Lead',
      color: '#6E5DC6',
      cognitiveLoad: 64,
    },
  ];

  try {
    type GraphClient = {
      requestGraph?: (
        query: string,
        variables?: Record<string, unknown>
      ) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;
    };
    const api = forgeApi.default as unknown as {
      asApp: () => GraphClient;
      asUser?: () => GraphClient;
    };

    const graphClient =
      authMode === 'user' && typeof api.asUser === 'function'
        ? api.asUser()
        : authMode === 'app'
          ? api.asApp()
          : null;
    if (graphClient && typeof graphClient.requestGraph === 'function' && cloudId && cloudId !== 'current') {
      const res = await graphClient.requestGraph(TWG_GOALS_AND_TEAMS_GRAPHQL_QUERY, {
        cloudId,
        projectKey,
      });
      if (res.ok) {
        const graphData = (await res.json()) as {
          data?: {
            graphStore?: {
              projectGoalsAndDecisions?: {
                edges?: TwgGraphEdgeRow[];
              };
            };
          };
        };

        const rawEdges =
          graphData?.data?.graphStore?.projectGoalsAndDecisions?.edges ?? [];
        const parsed = parseTeamworkGraphEdges(rawEdges, {
          referenceDate,
          sprintOffset,
          releaseOffset,
          defaultTeams,
          allowedIssueKeys,
        });

        if (parsed.goals.length > 0) {
          return {
            goals: parsed.goals,
            teams: [],
            issueGoalMap: parsed.issueGoalMap,
            issueConfluenceMap: parsed.issueConfluenceMap,
          };
        }
      }
    }
  } catch {
    // Fallback to project-aligned TWG Goals & dynamic issue-derived Teams
  }

  return {
    goals: defaultGoals,
    teams: [],
    issueGoalMap: {},
    issueConfluenceMap: {},
  };
}
