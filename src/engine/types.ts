/**
 * Project World Model (PWM) — Core Causal AI & Monte Carlo Simulation Types
 * Zero-dependency TypeScript types for Atlassian Forge (nodejs20.x).
 */

export type IssueStatusCategory = 'To Do' | 'In Progress' | 'Blocked' | 'Done' | string;

export type DependencyType =
  | 'Blocks'
  | 'Depends on'
  | 'Architectural Decision'
  | 'Cross-Team Handoff'
  | 'Architecture Gate'
  | 'Relates to'
  | string;

/**
 * A node in the Project World Model Directed Acyclic Graph (DAG).
 */
export interface CausalNode {
  id: string;
  key: string;
  summary: string;
  status: IssueStatusCategory;
  baseEstimateDays: number;
  uncertaintySigma: number;
  assignee: string;
  team: string;
  goalId: string;
  /** Optional metadata for Time Machine sprint scrubbing & visual graph rendering */
  sprint?: number;
  issueType?: 'Epic' | 'Story' | 'Task' | 'Bug' | 'Milestone' | string;
  storyPoints?: number;
  completedDaysAgo?: number;
  dueDate?: string;
  /** Linked Confluence Architectural Decision (ADR) from Atlassian Teamwork Graph */
  confluenceDecision?: {
    id: string;
    title: string;
    spaceKey: string;
  };
}

/**
 * A directed causal edge `from -> to` indicating that `to` causally depends on `from`.
 * When `from` is delayed/accelerated by Δ days, the shock propagates to `to` scaled by `propagationWeight`.
 */
export interface CausalEdge {
  from: string;
  to: string;
  dependencyType: DependencyType;
  propagationWeight: number;
}

/**
 * High-level Atlassian Teamwork Graph (TWG) Goal / OKR linked to Jira issues.
 */
export interface TeamworkGoal {
  id: string;
  key: string;
  name: string;
  targetDate: string;
  targetDayOffset: number;
  ownerTeam: string;
  description?: string;
  status: 'On Track' | 'At Risk' | 'Off Track';
}

/**
 * Atlassian Teamwork Graph Team metadata.
 */
export interface TeamMetadata {
  id: string;
  name: string;
  lead: string;
  color: string;
  cognitiveLoad: number;
}

/**
 * Complete self-contained Causal DAG snapshot.
 */
export interface CausalGraph {
  projectKey: string;
  projectName: string;
  referenceDate: string;
  source: 'jira-live' | 'synthetic-seed';
  /** True when auto-fallback or demo seeder loaded Project Chronos (< 5 live Jira issues) */
  isSyntheticDemo: boolean;
  nodes: CausalNode[];
  edges: CausalEdge[];
  goals: TeamworkGoal[];
  teams: TeamMetadata[];
  cycleWarnings: string[];
  topologicalOrder: string[];
}

/**
 * Counterfactual $do$-calculus intervention parameters.
 */
export interface WhatIfInterventionOptions {
  targetNodeId: string;
  /** Signed day shift: -5 (accelerate) to +60 (delay) */
  deltaDays: number;
  /** Simulate adding a swarm developer (+1 resource -> -35% estimate, -40% sigma) */
  addDeveloper?: boolean;
  /** Simulate decoupling hard blocking edges from targetNodeId (reduces outgoing weight to 0.25) */
  decoupleBlockingEdges?: boolean;
}

/**
 * Per-node Monte Carlo distribution statistics across 500 simulated worlds.
 */
export interface NodeSimulationStats {
  nodeId: string;
  key: string;
  summary: string;
  team: string;
  goalId: string;
  status: IssueStatusCategory;
  baseEstimateDays: number;
  uncertaintySigma: number;
  p50StartDay: number;
  p50EndDay: number;
  p85EndDay: number;
  p95EndDay: number;
  p50Date: string;
  p85Date: string;
  p95Date: string;
  meanDurationDays: number;
  slackDays: number;
  /** Fraction of Monte Carlo iterations (0..1) where this node lies on the longest path */
  criticalityIndex: number;
  /** Signed counterfactual ripple shift in days when an intervention is active */
  rippleDelayDays: number;
  /** Effective causal propagation weight from the intervened node (0..1) */
  effectivePropagationWeight: number;
}

/**
 * Impact of baseline or counterfactual schedule on an Atlassian Teamwork Graph Goal.
 */
export interface GoalImpact {
  goalId: string;
  goalKey: string;
  goalName: string;
  ownerTeam: string;
  targetDate: string;
  targetDayOffset: number;
  p50CompletionDate: string;
  p85CompletionDate: string;
  p95CompletionDate: string;
  p85DayOffset: number;
  baselineP85Date?: string;
  rippleDelayDays: number;
  bufferDays: number;
  probabilityOfOnTime: number;
  status: 'On Track' | 'At Risk' | 'Off Track';
  contributingIssueKeys: string[];
}

/**
 * Bottleneck ranking entry for critical path diagnostics.
 */
export interface BottleneckDiagnostic {
  key: string;
  id: string;
  summary: string;
  team: string;
  assignee: string;
  status: string;
  goalId: string;
  baseEstimateDays: number;
  uncertaintySigma: number;
  criticalityIndex: number;
  downstreamCount: number;
  /** Cumulative downstream causal ripple weight across all reachable dependent nodes */
  downstreamRippleWeight: number;
  slackDays: number;
  riskScore: number;
  recommendation: string;
}

/**
 * Probability density & CDF bucket for rendering Future Probability Cones in the UI.
 */
export interface ProbabilityConeBucket {
  dayOffset: number;
  date: string;
  probability: number;
  cumulativeProbability: number;
}

/**
 * Historical & future sprint snapshot for the Jira Time Machine timeline scrubber.
 */
export interface TimeMachineEpoch {
  epochId: string;
  label: string;
  dayOffset: number;
  date: string;
  mode: 'past' | 'present' | 'future-p50' | 'future-p85' | 'future-p95';
  completedCount: number;
  inProgressCount: number;
  blockedCount: number;
  todoCount: number;
  projectedP85Date: string;
  confidenceScore: number;
  narrative: string;
}

/**
 * Output of the Project World Model Monte Carlo & Counterfactual Simulation Engine.
 */
export interface SimulationResult {
  p50Date: string;
  p85Date: string;
  p95Date: string;
  p50Days: number;
  p85Days: number;
  p95Days: number;
  /** Conditional Value at Risk (CVaR_0.95 = E[T | T >= P95]) ported from ProjectWorldModel */
  cvar95Days: number;
  cvar95Date: string;
  /** Asymmetric Quasimetric Latent Energy E(s -> s' | z_env) ported from ProjectWorldModel */
  quasimetricEnergy: number;
  /** Estimated human rework hours at risk / saved (PWM CRR Engine) */
  estimatedReworkHours: number;
  criticalPathNodes: string[];
  blastRadiusNodes: string[];
  rippleDelayDays: number;
  iterations: number;
  executionTimeMs: number;
  referenceDate: string;
  intervenedNodeKey?: string;
  interventionDeltaDays?: number;
  addDeveloper?: boolean;
  decoupleBlockingEdges?: boolean;
  nodeStats: Record<string, NodeSimulationStats>;
  goalImpacts: GoalImpact[];
  topBottlenecks: BottleneckDiagnostic[];
  distributionBuckets: ProbabilityConeBucket[];
  timeMachineEpochs: TimeMachineEpoch[];
}

/**
 * Detailed counterfactual comparison returned by `runIntervention(graph, targetNodeId, deltaDays, options)`.
 */
export interface InterventionResult extends SimulationResult {
  targetNodeKey: string;
  targetNodeSummary: string;
  deltaDays: number;
  baseline: {
    p50Date: string;
    p85Date: string;
    p95Date: string;
    p50Days: number;
    p85Days: number;
    p95Days: number;
    distributionBuckets: ProbabilityConeBucket[];
  };
  intervened: {
    p50Date: string;
    p85Date: string;
    p95Date: string;
    p50Days: number;
    p85Days: number;
    p95Days: number;
    distributionBuckets: ProbabilityConeBucket[];
  };
  p50ShiftDays: number;
  p85ShiftDays: number;
  p95ShiftDays: number;
  nodeDeltas: Array<{
    key: string;
    summary: string;
    team: string;
    goalId: string;
    baselineP85Date: string;
    intervenedP85Date: string;
    shiftDays: number;
    effectiveWeight: number;
  }>;
}

/**
 * Raw Jira REST API v3 issue structure for DAG construction.
 */
export interface RawJiraIssueLink {
  id?: string;
  type?: {
    name?: string;
    inward?: string;
    outward?: string;
  };
  inwardIssue?: {
    id?: string;
    key: string;
    fields?: {
      summary?: string;
      status?: { name?: string };
    };
  };
  outwardIssue?: {
    id?: string;
    key: string;
    fields?: {
      summary?: string;
      status?: { name?: string };
    };
  };
}

export interface RawJiraIssue {
  id: string;
  key: string;
  fields: {
    summary?: string;
    status?: {
      name?: string;
      statusCategory?: { name?: string; key?: string };
    };
    assignee?: {
      displayName?: string;
      accountId?: string;
    } | null;
    issuetype?: {
      name?: string;
    };
    duedate?: string | null;
    timetracking?: {
      originalEstimateSeconds?: number;
      remainingEstimateSeconds?: number;
    } | null;
    timeoriginalestimate?: number | null;
    timeestimate?: number | null;
    customfield_10016?: number | null; // Story points
    labels?: string[];
    issuelinks?: RawJiraIssueLink[];
    parent?: {
      id?: string;
      key?: string;
      fields?: { summary?: string };
    };
  };
}
