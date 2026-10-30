/**
 * Project World Model (PWM) — Synthetic Seeder & Judge-Ready Demo Dataset
 *
 * Implements "Project Chronos: Next-Gen Platform Launch":
 * - 18 interconnected CausalNodes across 3 Engineering Teams (*Core Engine*, *Cloud Infra*, *Client UI*)
 * - 2 high-level Atlassian Teamwork Graph (TWG) Goals (*Zero-Downtime Migration*, *Q4 Global Launch*)
 * - Rich cross-team causal edges (`Blocks`, `Depends on`, `Architectural Decision`)
 * - Provides `seedJiraProject(projectKey)` (and `seedProjectChronosScenario`) to either:
 *   (a) Populate real linked Jira issues via `api.asApp().requestJira(route`/rest/api/3/issue`)`
 *   (b) Load a zero-setup in-memory / Forge storage causal graph snapshot (`isSyntheticDemo: true`)
 */

import { addCalendarDays, buildCausalDAG } from '../engine/dag';
import {
  CausalEdge,
  CausalGraph,
  CausalNode,
  TeamMetadata,
  TeamworkGoal,
} from '../engine/types';

export const CHRONOS_DEFAULT_REFERENCE_DATE = '2026-10-30';

export const CHRONOS_TEAMS: TeamMetadata[] = [
  {
    id: 'team-core-engine',
    name: 'Core Engine',
    lead: 'Elena Vance',
    color: '#6366f1',
    cognitiveLoad: 78,
  },
  {
    id: 'team-cloud-infra',
    name: 'Cloud Infra',
    lead: 'Marcus Chen',
    color: '#06b6d4',
    cognitiveLoad: 74,
  },
  {
    id: 'team-client-ui',
    name: 'Client UI',
    lead: 'Aria Patel',
    color: '#10b981',
    cognitiveLoad: 66,
  },
];

export function buildChronosGoals(
  referenceDate: string = CHRONOS_DEFAULT_REFERENCE_DATE
): TeamworkGoal[] {
  return [
    {
      id: 'GOAL-ALPHA',
      key: 'TWG-GOAL-101',
      name: 'Zero-Downtime Migration',
      targetDate: addCalendarDays(referenceDate, 24),
      targetDayOffset: 24,
      ownerTeam: 'Core Engine',
      description:
        'Complete distributed state WAL sync, zero-copy graph serializer, and zero-downtime multi-region cutover under 50ms.',
      status: 'On Track',
    },
    {
      id: 'GOAL-OMEGA',
      key: 'TWG-GOAL-202',
      name: 'Q4 Global Launch',
      targetDate: addCalendarDays(referenceDate, 43),
      targetDayOffset: 43,
      ownerTeam: 'Client UI',
      description:
        'Ship interactive Time Machine cockpit, Rovo Causal Agent actions, MCP server endpoint, and pass global production readiness.',
      status: 'On Track',
    },
  ];
}

/**
 * Generates the 18 interconnected nodes for "Project Chronos: Next-Gen Platform Launch"
 * across *Core Engine*, *Cloud Infra*, and *Client UI*.
 */
export function buildChronosNodes(
  projectKey: string = 'CHRON',
  referenceDate: string = CHRONOS_DEFAULT_REFERENCE_DATE
): CausalNode[] {
  const prefix = projectKey.trim().toUpperCase() || 'CHRON';
  const k = (num: number): string => `${prefix}-${num}`;

  return [
    // =========================================================================
    // TEAM 1: Core Engine (6 Nodes: 101..106)
    // =========================================================================
    {
      id: k(101),
      key: k(101),
      summary: 'Event-Sourced Graph Schema & Immutable Ledger Spec',
      status: 'Done',
      baseEstimateDays: 4,
      uncertaintySigma: 0.4,
      assignee: 'Elena Vance',
      team: 'Core Engine',
      goalId: 'GOAL-ALPHA',
      sprint: -2,
      issueType: 'Epic',
      storyPoints: 5,
      completedDaysAgo: 18,
      dueDate: addCalendarDays(referenceDate, -18),
      confluenceDecision: {
        id: 'CONF-ADR-01',
        title: 'ADR-01: Event-Sourced Causal Graph Ledger Specification',
        spaceKey: 'ARCH',
      },
    },
    {
      id: k(102),
      key: k(102),
      summary: 'Multi-Tenant Storage Sharding & Key-Value Snapshot Layer',
      status: 'Done',
      baseEstimateDays: 5,
      uncertaintySigma: 0.5,
      assignee: 'Devon Brooks',
      team: 'Core Engine',
      goalId: 'GOAL-ALPHA',
      sprint: -1,
      issueType: 'Story',
      storyPoints: 5,
      completedDaysAgo: 9,
      dueDate: addCalendarDays(referenceDate, -9),
    },
    {
      id: k(103),
      key: k(103),
      summary: 'Incremental Jira Webhook & IssueLink Ingestion Pipeline',
      status: 'In Progress',
      baseEstimateDays: 5,
      uncertaintySigma: 1.4,
      assignee: 'Devon Brooks',
      team: 'Core Engine',
      goalId: 'GOAL-ALPHA',
      sprint: 0,
      issueType: 'Story',
      storyPoints: 5,
      dueDate: addCalendarDays(referenceDate, 5),
    },
    {
      id: k(104),
      key: k(104),
      summary: 'Distributed State Snapshot & WAL Sync Protocol',
      status: 'In Progress',
      baseEstimateDays: 7,
      uncertaintySigma: 2.3,
      assignee: 'Elena Vance',
      team: 'Core Engine',
      goalId: 'GOAL-ALPHA',
      sprint: 0,
      issueType: 'Epic',
      storyPoints: 8,
      dueDate: addCalendarDays(referenceDate, 7),
      confluenceDecision: {
        id: 'CONF-ADR-04',
        title: 'ADR-04: Distributed WAL Consensus & Snapshot Handoff Protocol',
        spaceKey: 'ARCH',
      },
    },
    {
      id: k(105),
      key: k(105),
      summary: 'High-Throughput Graph Mutation & Concurrency Lock Manager',
      status: 'To Do',
      baseEstimateDays: 6,
      uncertaintySigma: 1.8,
      assignee: 'Elena Vance',
      team: 'Core Engine',
      goalId: 'GOAL-ALPHA',
      sprint: 1,
      issueType: 'Story',
      storyPoints: 8,
      dueDate: addCalendarDays(referenceDate, 14),
    },
    {
      id: k(106),
      key: k(106),
      summary: 'Core Engine Chaos Fault-Injection & Zero-Downtime Cutover Gate',
      status: 'To Do',
      baseEstimateDays: 5,
      uncertaintySigma: 1.5,
      assignee: 'Devon Brooks',
      team: 'Core Engine',
      goalId: 'GOAL-ALPHA',
      sprint: 1,
      issueType: 'Task',
      storyPoints: 5,
      dueDate: addCalendarDays(referenceDate, 21),
    },

    // =========================================================================
    // TEAM 2: Cloud Infra (6 Nodes: 107..112)
    // =========================================================================
    {
      id: k(107),
      key: k(107),
      summary: 'Topological Sort & Three-Color DFS Cycle Breaker Kernel',
      status: 'Done',
      baseEstimateDays: 4,
      uncertaintySigma: 0.3,
      assignee: 'Marcus Chen',
      team: 'Cloud Infra',
      goalId: 'GOAL-ALPHA',
      sprint: -2,
      issueType: 'Story',
      storyPoints: 5,
      completedDaysAgo: 15,
      dueDate: addCalendarDays(referenceDate, -15),
    },
    {
      id: k(108),
      key: k(108),
      summary: 'Twin-Network Common Random Numbers (CRN) Monte Carlo Sampler',
      status: 'In Progress',
      baseEstimateDays: 6,
      uncertaintySigma: 1.6,
      assignee: 'Marcus Chen',
      team: 'Cloud Infra',
      goalId: 'GOAL-ALPHA',
      sprint: 0,
      issueType: 'Story',
      storyPoints: 8,
      dueDate: addCalendarDays(referenceDate, 6),
    },
    {
      id: k(109),
      key: k(109),
      summary: 'Zero-Copy Graph Tensor Serializer & Multi-Region Replication Bridge',
      status: 'Blocked',
      baseEstimateDays: 6,
      uncertaintySigma: 2.5,
      assignee: 'Sora Takahashi',
      team: 'Cloud Infra',
      goalId: 'GOAL-ALPHA',
      sprint: 0,
      issueType: 'Story',
      storyPoints: 8,
      dueDate: addCalendarDays(referenceDate, 13),
    },
    {
      id: k(110),
      key: k(110),
      summary: 'Atlassian Teamwork Graph (TWG) Goal-to-Issue Alignment Resolver',
      status: 'To Do',
      baseEstimateDays: 5,
      uncertaintySigma: 1.5,
      assignee: 'Sora Takahashi',
      team: 'Cloud Infra',
      goalId: 'GOAL-OMEGA',
      sprint: 1,
      issueType: 'Story',
      storyPoints: 5,
      dueDate: addCalendarDays(referenceDate, 19),
    },
    {
      id: k(111),
      key: k(111),
      summary: 'Rovo Counterfactual Action Handlers & Bottleneck Synthesizer',
      status: 'To Do',
      baseEstimateDays: 5,
      uncertaintySigma: 1.4,
      assignee: 'Marcus Chen',
      team: 'Cloud Infra',
      goalId: 'GOAL-OMEGA',
      sprint: 2,
      issueType: 'Story',
      storyPoints: 5,
      dueDate: addCalendarDays(referenceDate, 26),
    },
    {
      id: k(112),
      key: k(112),
      summary: 'Model Context Protocol (MCP) JSON-RPC World Model Webtrigger',
      status: 'To Do',
      baseEstimateDays: 4,
      uncertaintySigma: 1.2,
      assignee: 'Sora Takahashi',
      team: 'Cloud Infra',
      goalId: 'GOAL-OMEGA',
      sprint: 2,
      issueType: 'Task',
      storyPoints: 5,
      dueDate: addCalendarDays(referenceDate, 30),
    },

    // =========================================================================
    // TEAM 3: Client UI (6 Nodes: 113..118)
    // =========================================================================
    {
      id: k(113),
      key: k(113),
      summary: 'Dark-Mode Cockpit Design System & Probability Cone Tokens',
      status: 'Done',
      baseEstimateDays: 3,
      uncertaintySigma: 0.3,
      assignee: 'Aria Patel',
      team: 'Client UI',
      goalId: 'GOAL-OMEGA',
      sprint: -1,
      issueType: 'Story',
      storyPoints: 3,
      completedDaysAgo: 11,
      dueDate: addCalendarDays(referenceDate, -11),
    },
    {
      id: k(114),
      key: k(114),
      summary: 'Interactive Causal DAG Canvas & Blast Radius Ripple Renderer',
      status: 'In Progress',
      baseEstimateDays: 6,
      uncertaintySigma: 1.5,
      assignee: 'Aria Patel',
      team: 'Client UI',
      goalId: 'GOAL-OMEGA',
      sprint: 0,
      issueType: 'Story',
      storyPoints: 8,
      dueDate: addCalendarDays(referenceDate, 6),
    },
    {
      id: k(115),
      key: k(115),
      summary: 'Temporal Scrubber ("Time Machine") Past-to-Future Cone Slider',
      status: 'To Do',
      baseEstimateDays: 5,
      uncertaintySigma: 1.4,
      assignee: 'Liam O’Connor',
      team: 'Client UI',
      goalId: 'GOAL-OMEGA',
      sprint: 1,
      issueType: 'Story',
      storyPoints: 5,
      dueDate: addCalendarDays(referenceDate, 18),
    },
    {
      id: k(116),
      key: k(116),
      summary: 'Real-Time Delay/Accelerate Intervention Panel & Goal Telemetry HUD',
      status: 'To Do',
      baseEstimateDays: 5,
      uncertaintySigma: 1.5,
      assignee: 'Aria Patel',
      team: 'Client UI',
      goalId: 'GOAL-OMEGA',
      sprint: 2,
      issueType: 'Story',
      storyPoints: 5,
      dueDate: addCalendarDays(referenceDate, 25),
    },
    {
      id: k(117),
      key: k(117),
      summary: 'End-to-End Multi-Team Shadow Simulation & Load Verification',
      status: 'To Do',
      baseEstimateDays: 5,
      uncertaintySigma: 1.7,
      assignee: 'Liam O’Connor',
      team: 'Client UI',
      goalId: 'GOAL-OMEGA',
      sprint: 2,
      issueType: 'Task',
      storyPoints: 5,
      dueDate: addCalendarDays(referenceDate, 33),
    },
    {
      id: k(118),
      key: k(118),
      summary: 'Project Chronos Q4 Global Launch Production Cutover & Sign-Off',
      status: 'To Do',
      baseEstimateDays: 4,
      uncertaintySigma: 1.1,
      assignee: 'Aria Patel',
      team: 'Client UI',
      goalId: 'GOAL-OMEGA',
      sprint: 3,
      issueType: 'Milestone',
      storyPoints: 5,
      dueDate: addCalendarDays(referenceDate, 39),
    },
  ];
}

/**
 * Generates the causal dependency edges (`Blocks`, `Depends on`, `Architectural Decision`)
 * connecting the 18 nodes across *Core Engine*, *Cloud Infra*, and *Client UI*.
 */
export function buildChronosEdges(projectKey: string = 'CHRON'): CausalEdge[] {
  const prefix = projectKey.trim().toUpperCase() || 'CHRON';
  const k = (num: number): string => `${prefix}-${num}`;

  return [
    // Foundation links
    { from: k(101), to: k(102), dependencyType: 'Blocks', propagationWeight: 1.0 },
    { from: k(101), to: k(107), dependencyType: 'Architectural Decision', propagationWeight: 0.9 },
    { from: k(102), to: k(103), dependencyType: 'Blocks', propagationWeight: 0.9 },
    { from: k(102), to: k(104), dependencyType: 'Blocks', propagationWeight: 1.0 },

    // Critical bottleneck fan-out from CHRON-104 (Distributed State Snapshot & WAL Sync Protocol)
    { from: k(104), to: k(105), dependencyType: 'Blocks', propagationWeight: 1.0 },
    { from: k(104), to: k(109), dependencyType: 'Architectural Decision', propagationWeight: 1.0 },
    { from: k(103), to: k(110), dependencyType: 'Depends on', propagationWeight: 0.85 },

    // Core Engine completion chain -> GOAL-ALPHA (Zero-Downtime Migration)
    { from: k(105), to: k(106), dependencyType: 'Blocks', propagationWeight: 1.0 },
    { from: k(109), to: k(106), dependencyType: 'Depends on', propagationWeight: 0.85 },

    // Cloud Infra chain
    { from: k(107), to: k(108), dependencyType: 'Blocks', propagationWeight: 1.0 },
    { from: k(108), to: k(109), dependencyType: 'Blocks', propagationWeight: 0.95 },
    { from: k(109), to: k(110), dependencyType: 'Blocks', propagationWeight: 1.0 },
    { from: k(109), to: k(111), dependencyType: 'Blocks', propagationWeight: 1.0 },
    { from: k(110), to: k(111), dependencyType: 'Depends on', propagationWeight: 0.9 },
    { from: k(110), to: k(112), dependencyType: 'Blocks', propagationWeight: 0.95 },

    // Client UI chain + Cross-Team Handoffs
    { from: k(113), to: k(114), dependencyType: 'Blocks', propagationWeight: 1.0 },
    { from: k(108), to: k(115), dependencyType: 'Architectural Decision', propagationWeight: 0.85 },
    { from: k(114), to: k(115), dependencyType: 'Blocks', propagationWeight: 1.0 },
    { from: k(109), to: k(116), dependencyType: 'Depends on', propagationWeight: 0.95 },
    { from: k(115), to: k(116), dependencyType: 'Blocks', propagationWeight: 1.0 },

    // Final convergence to Q4 Global Launch (CHRON-117 -> CHRON-118)
    { from: k(106), to: k(117), dependencyType: 'Architectural Decision', propagationWeight: 0.95 },
    { from: k(111), to: k(117), dependencyType: 'Blocks', propagationWeight: 1.0 },
    { from: k(112), to: k(117), dependencyType: 'Depends on', propagationWeight: 0.9 },
    { from: k(116), to: k(117), dependencyType: 'Blocks', propagationWeight: 1.0 },
    { from: k(117), to: k(118), dependencyType: 'Blocks', propagationWeight: 1.0 },
  ];
}

/**
 * Returns the complete, cycle-verified 18-node "Project Chronos: Next-Gen Platform Launch"
 * `CausalGraph` snapshot (`isSyntheticDemo: true`) ready for simulation.
 */
export function getChronosSyntheticGraph(
  projectKey: string = 'CHRON',
  referenceDate: string = CHRONOS_DEFAULT_REFERENCE_DATE
): CausalGraph {
  const cleanKey = projectKey.trim().toUpperCase() || 'CHRON';
  const nodes = buildChronosNodes(cleanKey, referenceDate);
  const edges = buildChronosEdges(cleanKey);
  const goals = buildChronosGoals(referenceDate);

  return buildCausalDAG({
    projectKey: cleanKey,
    projectName: 'Project Chronos: Next-Gen Platform Launch',
    referenceDate,
    source: 'synthetic-seed',
    isSyntheticDemo: true,
    nodes,
    edges,
    goals,
    teams: CHRONOS_TEAMS,
  });
}

export interface SeedExecutionReport {
  mode: 'in-memory-snapshot' | 'jira-issues-populated';
  projectKey: string;
  createdIssuesCount: number;
  createdLinksCount: number;
  graph: CausalGraph;
  message: string;
}

/**
 * Helper `seedJiraProject(projectKey)` that uses `api.asApp().requestJira(route`/rest/api/3/issue`)`
 * to create real linked demo issues in Jira when the user clicks "Create Real Jira Issues".
 */
export async function seedJiraProject(projectKey: string = 'CHRON'): Promise<SeedExecutionReport> {
  return seedProjectChronosScenario({
    projectKey,
    populateJiraIssues: true,
  });
}

/**
 * Populates the Project Chronos scenario either:
 * (a) into live Jira issues + issueLinks via `api.asApp().requestJira()` when `populateJiraIssues` is true, OR
 * (b) into an in-memory / Forge app storage causal graph snapshot (`isSyntheticDemo: true`) so judges can test
 *     immediately in empty Jira cloud instances with zero setup.
 */
export async function seedProjectChronosScenario(options: {
  projectKey?: string;
  populateJiraIssues?: boolean;
  referenceDate?: string;
} = {}): Promise<SeedExecutionReport> {
  const projectKey = (options.projectKey || 'CHRON').trim().toUpperCase();
  const referenceDate = options.referenceDate || CHRONOS_DEFAULT_REFERENCE_DATE;
  const syntheticGraph = getChronosSyntheticGraph(projectKey, referenceDate);

  // Attempt to persist snapshot in Forge KVS storage if running inside Atlassian Forge
  try {
    const forgeApi = await import('@forge/api');
    if (forgeApi?.storage) {
      await forgeApi.storage.set(`pwm:graph:${projectKey}`, syntheticGraph);
      await forgeApi.storage.set('pwm:activeDemoGraph', syntheticGraph);
    }
  } catch {
    // Running outside Forge runtime (e.g., local test runner); in-memory graph is returned directly
  }

  if (!options.populateJiraIssues) {
    return {
      mode: 'in-memory-snapshot',
      projectKey,
      createdIssuesCount: 0,
      createdLinksCount: 0,
      graph: syntheticGraph,
      message: `Loaded "Project Chronos: Next-Gen Platform Launch" (${syntheticGraph.nodes.length} causal nodes, ${syntheticGraph.edges.length} dependency links across ${syntheticGraph.teams.length} teams and ${syntheticGraph.goals.length} Teamwork Graph Goals).`,
    };
  }

  // Option (a): Attempt to create real linked Jira issues via `api.asApp().requestJira(route`/rest/api/3/issue`)`
  let createdIssuesCount = 0;
  let createdLinksCount = 0;
  const syntheticToRealKey = new Map<string, string>();

  try {
    const forgeApi = await import('@forge/api');
    const api = forgeApi.default;
    const { route } = forgeApi;

    for (const node of syntheticGraph.nodes) {
      const response = await api.asApp().requestJira(route`/rest/api/3/issue`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            project: { key: projectKey },
            summary: `[PWM] ${node.summary}`,
            issuetype: { name: 'Task' },
            labels: [
              `team:${node.team.replace(/\s+/g, '-')}`,
              `goal:${node.goalId}`,
              `estimate:${node.baseEstimateDays}d`,
            ],
          },
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as { key?: string };
        if (data?.key) {
          syntheticToRealKey.set(node.key, data.key);
          createdIssuesCount++;
        }
      } else {
        break;
      }
    }

    if (createdIssuesCount >= 5) {
      for (const edge of syntheticGraph.edges) {
        const outwardKey = syntheticToRealKey.get(edge.to);
        const inwardKey = syntheticToRealKey.get(edge.from);
        if (!outwardKey || !inwardKey) continue;

        const linkRes = await api.asApp().requestJira(route`/rest/api/3/issueLink`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: { name: 'Blocks' },
            inwardIssue: { key: inwardKey },
            outwardIssue: { key: outwardKey },
          }),
        });
        if (linkRes.ok) {
          createdLinksCount++;
        }
      }

      return {
        mode: 'jira-issues-populated',
        projectKey,
        createdIssuesCount,
        createdLinksCount,
        graph: syntheticGraph,
        message: `Populated ${createdIssuesCount} live Jira issues and ${createdLinksCount} dependency links in project ${projectKey}, and synced the Project Chronos World Model snapshot.`,
      };
    }
  } catch (err) {
    console.warn(
      `[PWM Seeder] Live Jira issue population skipped or unavailable (${err instanceof Error ? err.message : String(err)}); using high-fidelity in-memory snapshot.`
    );
  }

  return {
    mode: 'in-memory-snapshot',
    projectKey,
    createdIssuesCount,
    createdLinksCount,
    graph: syntheticGraph,
    message: `Loaded "Project Chronos: Next-Gen Platform Launch" snapshot (${syntheticGraph.nodes.length} nodes, ${syntheticGraph.edges.length} causal edges across 3 teams and 2 Teamwork Graph Goals).`,
  };
}
