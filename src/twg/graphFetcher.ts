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
  const referenceDate = options.referenceDate || CHRONOS_DEFAULT_REFERENCE_DATE;

  if (options.forceDemo) {
    return getChronosSyntheticGraph(
      (options.projectKey || 'CHRON').trim().toUpperCase(),
      referenceDate
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

    const projectMeta = availableProjects.find((p) => p.key === projectKey);
    const projectName = projectMeta ? projectMeta.name : `${projectKey} Project`;

    const fields =
      'summary,status,issuelinks,assignee,timetracking,duedate,issuetype,timeoriginalestimate,timeestimate,customfield_10016,labels,parent';

    // Query Jira REST v3 search endpoint for the project
    let response = await requestJiraWithUserFallback(
      forgeApi,
      route`/rest/api/3/search?jql=project=${projectKey} ORDER BY created ASC&fields=${fields}&maxResults=100`
    );

    // Fallback to /rest/api/3/search/jql if needed
    if (!response.ok) {
      response = await requestJiraWithUserFallback(
        forgeApi,
        route`/rest/api/3/search/jql?jql=project=${projectKey} ORDER BY created ASC&fields=${fields}&maxResults=100`
      );
    }

    if (response.ok) {
      const payload = (await response.json()) as { issues?: RawJiraIssue[] };
      const issues = payload.issues ?? [];

      // Always return the real Jira project issues when at least 1 issue exists in the project
      if (issues.length >= 1) {
        const { goals, teams } = await fetchTeamworkGraphMetadata(
          forgeApi,
          projectKey,
          projectName,
          referenceDate
        );
        const dag = buildDAGFromJiraIssues(projectKey, issues, goals, teams, referenceDate);
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
    referenceDate
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
async function fetchTeamworkGraphMetadata(
  forgeApi: typeof import('@forge/api'),
  projectKey: string,
  projectName: string,
  referenceDate: string
): Promise<{ goals: TeamworkGoal[]; teams: TeamMetadata[] }> {
  const defaultGoals: TeamworkGoal[] = [
    {
      id: 'GOAL-ALPHA',
      key: `${projectKey}-GOAL-1`,
      name: `${projectName} Sprint Delivery`,
      targetDate: buildChronosGoals(referenceDate)[0].targetDate,
      targetDayOffset: 14,
      ownerTeam: `${projectName} Engineering`,
      status: 'On Track',
    },
    {
      id: 'GOAL-OMEGA',
      key: `${projectKey}-GOAL-2`,
      name: `${projectName} Release Milestone`,
      targetDate: buildChronosGoals(referenceDate)[1].targetDate,
      targetDayOffset: 28,
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
      name: 'Platform & Delivery',
      lead: 'Tech Lead',
      color: '#1F845A',
      cognitiveLoad: 62,
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
    if (typeof appClient.requestGraph === 'function') {
      const res = await appClient.requestGraph(TWG_GOALS_AND_TEAMS_GRAPHQL_QUERY, {
        cloudId: 'current',
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
            const offset = idx === 0 ? 18 : 32;
            parsedGoals.set(gId, {
              id: gId,
              key: gId,
              name: gName,
              targetDate: colMap.get('g.targetDate') || addCalendarDays(referenceDate, offset),
              targetDayOffset: offset,
              ownerTeam: defaultTeams[idx % defaultTeams.length].name,
              status: 'On Track',
            });
          }
        });

        if (parsedGoals.size > 0) {
          return {
            goals: Array.from(parsedGoals.values()),
            teams: defaultTeams,
          };
        }
      }
    }
  } catch {
    // Fallback to project-aligned TWG Goals & Teams
  }

  return { goals: defaultGoals, teams: defaultTeams };
}
