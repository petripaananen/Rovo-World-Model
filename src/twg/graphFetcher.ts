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
}

/**
 * Invokes Jira REST API preferring `api.asUser()` (to enforce the current user's Jira browse permissions
 * in Custom UI & Rovo contexts) and gracefully falling back to `api.asApp()` when running in an
 * unauthenticated webtrigger (MCP server) or background context.
 */
async function requestJiraWithUserFallback(
  forgeApi: typeof import('@forge/api'),
  routeUrl: ReturnType<typeof import('@forge/api').route>
): Promise<{ ok: boolean; json: () => Promise<unknown> }> {
  const api = forgeApi.default;
  try {
    if (typeof api.asUser === 'function') {
      const userRes = await api.asUser().requestJira(routeUrl, {
        headers: { Accept: 'application/json' },
      });
      if (userRes && userRes.ok) {
        return userRes;
      }
    }
  } catch {
    // Fall back to app context when no user context is bound (e.g. MCP webtrigger)
  }

  return api.asApp().requestJira(routeUrl, {
    headers: { Accept: 'application/json' },
  });
}

/**
 * Fetches all available Jira projects on the user's Atlassian Cloud site (e.g., BloomPath Sprint, Triton).
 */
export async function fetchAvailableJiraProjects(): Promise<JiraProjectSummary[]> {
  try {
    const forgeApi = await import('@forge/api');
    const { route } = forgeApi;

    const response = await requestJiraWithUserFallback(
      forgeApi,
      route`/rest/api/3/project/search?maxResults=50`
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

  return [
    { id: 'BLP', key: 'BLP', name: 'BloomPath Sprint' },
    { id: 'TRI', key: 'TRI', name: 'Triton' },
  ];
}

/**
 * Fetches and builds the `CausalGraph` for a Jira project:
 * 1. If `forceDemo` is explicitly true, returns the synthetic graph (`isSyntheticDemo: true`).
 * 2. Queries live Jira issues + `issuelinks` for the active Jira project (even if the project has 1, 2, or 3 issues,
 *    such as `BLP-7` and `BLP-8` in BloomPath Sprint).
 * 3. Queries the Jira project name so the UI header displays the real Jira project name (e.g. `BloomPath Sprint` or `Triton`).
 * 4. Falls back to the synthetic graph only when running offline in local unit tests or when the project has 0 issues.
 */
export async function fetchProjectCausalGraph(
  options: LoadGraphOptions = {}
): Promise<CausalGraph> {
  const demoReferenceDate = options.referenceDate || CHRONOS_DEFAULT_REFERENCE_DATE;
  const liveReferenceDate =
    options.referenceDate || new Date().toISOString().slice(0, 10);

  if (options.forceDemo) {
    return getChronosSyntheticGraph(
      (options.projectKey || 'CHRON').trim().toUpperCase(),
      demoReferenceDate
    );
  }

  try {
    const forgeApi = await import('@forge/api');
    const { route } = forgeApi;

    const availableProjects = await fetchAvailableJiraProjects();
    let projectKey = (options.projectKey || '').trim().toUpperCase();

    if (!projectKey || projectKey === 'CHRON') {
      const matchedReal = availableProjects.find((p) => p.key !== 'CHRON');
      if (matchedReal) {
        projectKey = matchedReal.key;
      } else {
        projectKey = projectKey || 'BLP';
      }
    }

    const safeProjectKey = /^[A-Z][A-Z0-9_]*$/.test(projectKey)
      ? projectKey
      : 'BLP';
    const projectMeta = availableProjects.find((p) => p.key === safeProjectKey);
    const projectName = projectMeta ? projectMeta.name : `${safeProjectKey} Project`;

    const fields =
      'summary,status,issuelinks,assignee,timetracking,duedate,issuetype,timeoriginalestimate,timeestimate,customfield_10016,customfield_10001,components,labels,parent,subtasks';

    // Prefer Jira Cloud's current `/rest/api/3/search/jql` endpoint with quoted project key,
    // falling back to legacy `/rest/api/3/search` only if needed.
    let response = await requestJiraWithUserFallback(
      forgeApi,
      route`/rest/api/3/search/jql?jql=project="${safeProjectKey}" ORDER BY created ASC&fields=${fields}&maxResults=100`
    );

    if (!response.ok) {
      response = await requestJiraWithUserFallback(
        forgeApi,
        route`/rest/api/3/search?jql=project="${safeProjectKey}" ORDER BY created ASC&fields=${fields}&maxResults=100`
      );
    }

    if (response.ok) {
      const payload = (await response.json()) as { issues?: RawJiraIssue[] };
      const issues = payload.issues ?? [];

      // Always return the real Jira project issues when at least 1 issue exists in the project
      if (issues.length >= 1) {
        const { goals, teams } = await fetchTeamworkGraphMetadata(
          forgeApi,
          safeProjectKey,
          projectName,
          liveReferenceDate,
          options.cloudId
        );
        const dag = buildDAGFromJiraIssues(
          safeProjectKey,
          issues,
          goals,
          teams,
          liveReferenceDate
        );
        return {
          ...dag,
          projectName,
          isSyntheticDemo: false,
        };
      }
    }
  } catch (err) {
    console.info(
      `[PWM GraphFetcher] Using synthetic causal snapshot (${err instanceof Error ? err.message : 'offline/demo mode'}).`
    );
  }

  return getChronosSyntheticGraph(
    (options.projectKey || 'CHRON').trim().toUpperCase(),
    demoReferenceDate
  );
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

async function fetchTeamworkGraphMetadata(
  forgeApi: typeof import('@forge/api'),
  projectKey: string,
  projectName: string,
  referenceDate: string,
  cloudId?: string
): Promise<{ goals: TeamworkGoal[]; teams: TeamMetadata[] }> {
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
    const api = forgeApi.default as unknown as {
      asApp: () => {
        requestGraph?: (
          query: string,
          variables?: Record<string, unknown>
        ) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;
      };
    };

    const appClient = api.asApp();
    if (typeof appClient.requestGraph === 'function' && cloudId && cloudId !== 'current') {
      const res = await appClient.requestGraph(TWG_GOALS_AND_TEAMS_GRAPHQL_QUERY, {
        cloudId,
        projectKey,
      });
      if (res.ok) {
        const graphData = (await res.json()) as {
          data?: {
            graphStore?: {
              projectGoalsAndDecisions?: {
                edges?: Array<{
                  node?: {
                    columns?: Array<{ key?: string; value?: string }>;
                  };
                }>;
              };
            };
          };
        };

        const rawEdges =
          graphData?.data?.graphStore?.projectGoalsAndDecisions?.edges ?? [];
        const parsedGoals = new Map<string, TeamworkGoal>();

        rawEdges.forEach((edge, idx) => {
          const cols = edge?.node?.columns ?? [];
          const colMap = new Map<string, string>();
          for (const c of cols) {
            if (c.key && c.value) colMap.set(c.key, c.value);
          }
          const gId = colMap.get('g.id');
          const gName = colMap.get('g.name');
          if (gId && gName && !parsedGoals.has(gId)) {
            const fallbackOffset = idx === 0 ? sprintOffset : releaseOffset;
            const rawTargetDate = colMap.get('g.targetDate') || '';
            const offset = computeDayOffsetFromDates(
              referenceDate,
              rawTargetDate,
              fallbackOffset
            );
            parsedGoals.set(gId, {
              id: gId,
              key: gId,
              name: gName,
              targetDate: rawTargetDate || addCalendarDays(referenceDate, offset),
              targetDayOffset: offset,
              ownerTeam: defaultTeams[idx % defaultTeams.length].name,
              status: 'On Track',
            });
          }
        });

        if (parsedGoals.size > 0) {
          return {
            goals: Array.from(parsedGoals.values()),
            teams: [],
          };
        }
      }
    }
  } catch {
    // Fallback to project-aligned TWG Goals & dynamic issue-derived Teams
  }

  return { goals: defaultGoals, teams: [] };
}
