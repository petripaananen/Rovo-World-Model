/**
 * Project World Model (PWM) — Core Causal AI & Monte Carlo Simulation Types
 * Zero-dependency TypeScript types for Atlassian Forge (nodejs22.x).
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

export type PrecedenceType = 'FS' | 'SS' | 'FF' | 'SF';

/**
 * Discrete technical blocker / pure risk event (Bernoulli shock).
 */
export interface PureRiskEvent {
  id: string;
  title: string;
  /** Probability of occurrence in any given world (0..1) */
  probability: number;
  /** Schedule slip injected when the event triggers (days) */
  delayImpactDays: number;
  /** Upfront engineering effort required to mitigate (dev-days) */
  mitigationEffortDays?: number;
  /** Post-mitigation residual probability (0..1) */
  residualProbability?: number;
  /** Post-mitigation residual delay impact (days) */
  residualDelayDays?: number;
}

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
  issueType?: 'Epic' | 'Story' | 'Task' | 'Bug' | 'Milestone' | 'Gate' | string;
  storyPoints?: number;
  completedDaysAgo?: number;
  dueDate?: string;
  /** Linked Confluence Architectural Decision (ADR) from Atlassian Teamwork Graph */
  confluenceDecision?: {
    id: string;
    title: string;
    spaceKey: string;
  };
  /** 3-Point PERT Beta estimates (Min / MostLikely / Max in dev-days) */
  optimisticDays?: number;
  mostLikelyDays?: number;
  pessimisticDays?: number;
  /** Effective uninterrupted engineering work factor (default 0.70) */
  effectiveWorkFactor?: number;
  /** Assignee allocation ratio on this task (0.1 to 2.0; <0.2 indicates fragmentation) */
  allocationRatio?: number;
  /** Planned effort budget at completion (BAC) in Dev-Days */
  plannedEffortDays?: number;
  /** Actual effort logged to date (ACWP) in Dev-Days */
  actualEffortDays?: number;
  /** Whether the downstream task owner has accepted the completed handoff (unlocks 75% -> 100% EVM step) */
  handoffAcceptedByDownstream?: boolean;
  /** Squad size working on this task (used for N = n(n-1)/2 communication channels & Brooks's Law) */
  teamSize?: number;
  /** Optional discrete technical blocker events (Bernoulli shocks) */
  pureRisks?: PureRiskEvent[];
  /** Whether this node acts as an Architecture / Release Readiness Stage-Gate */
  isStageGate?: boolean;
  gateStatus?: 'Go' | 'Conditional Go' | 'Hold' | 'At Risk';
  /** Execution ownership mode for cross-team & external dependency risk tracking */
  executionMode?: 'internal-squad' | 'cross-team-dependency' | 'external-vendor-api';
  /** Completed sub-task or child issue count (for Epic / parent story completion rings) */
  subtaskDoneCount?: number;
  /** Total sub-task or child issue count (for Epic / parent story completion rings) */
  subtaskTotalCount?: number;
  /** Overall completion percentage (0..100) for outer node progress ring */
  subtaskProgressPct?: number;
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
  /** Precedence relationship: FS (Finish-to-Start), SS (Start-to-Start), FF (Finish-to-Finish), SF (Start-to-Finish) */
  precedenceType?: PrecedenceType;
  /** Lead/Lag days: > 0 for non-labor waiting lag (e.g. review/bake time), < 0 for fast-tracking overlap */
  lagDays?: number;
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

export interface NodeInterventionOverride {
  /** Signed day shift: -5 (accelerate) to +60 (delay) */
  deltaDays: number;
  /** Simulate adding a swarm developer (+1 resource -> -35% estimate, -40% sigma) */
  addDeveloper?: boolean;
  /** Simulate decoupling hard blocking edges from targetNodeId (reduces outgoing weight to 0.25) */
  decoupleBlockingEdges?: boolean;
  /** Simulate trimming / deferring non-essential sub-tasks to next cycle (-35% duration, -45% sigma) */
  trimScope?: boolean;
}

export interface AssigneeInterventionOverride {
  assignee: string;
  /** Signed absence / PTO / unavailability shift in days (-3 to +15) across this person's active issues */
  unavailableDays?: number;
  /** Offload this person's parallel bottleneck issue to reduce multi-tasking contention */
  reassignBottleneck?: boolean;
  /** Serialize concurrent WIP to eliminate context-switching variance */
  serializeParallelWork?: boolean;
  /** Pair an extra developer on this person's highest-criticality blocker issue */
  pairOnTopBlocker?: boolean;
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
  /** Simulate trimming / deferring non-essential sub-tasks to next cycle (-35% duration, -45% sigma) */
  trimScope?: boolean;
  /** Optional compound multi-task overrides keyed by Jira issue key */
  nodeOverrides?: Record<string, NodeInterventionOverride>;
  /** Optional person / assignee capacity & unavailability overrides keyed by assignee name */
  assigneeOverrides?: Record<string, AssigneeInterventionOverride>;
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
  /** Signed float relative to forced target deadline (negative when behind target / super-critical) */
  totalFloatDays?: number;
  /** Objective step-function completion percentage (0, 25, 50, 75, 100) */
  completionStepPct?: number;
  /** 3-Point PERT Beta expected duration & sigma when PERT is active */
  pertMeanDays?: number;
  pertSigmaDays?: number;
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
  /** Signed float relative to target deadline (negative when super-critical) */
  totalFloatDays?: number;
  /** Expected schedule risk reduction per day of mitigation effort */
  mitigationROI?: number;
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
 * Three-Tier Schedule & Effort Reserve Breakdown:
 * - Target Base (P50)
 * - PM / Sprint Contingency Reserve (P85 - P50)
 * - Executive Tail Reserve (CVaR95 - P85)
 */
export interface ReserveBreakdown {
  baseTargetDays: number;
  pmContingencyReserveDays: number;
  managementReserveDays: number;
  bufferBurnRatio: number;
  committedEffortRatio: number;
}

/**
 * Hierarchical Engineering Earned Value Management (EVM) in Dev-Days:
 * BAC, BCWS, BCWP (Earned Value), ACWP, CV, SV, CPI, SPI, EAC, and WBS squad masking detection.
 */
export interface EarnedValueSummary {
  bacDays: number;
  bcwsDays: number;
  bcwpDays: number;
  acwpDays: number;
  cvDays: number;
  svDays: number;
  cpi: number;
  spi: number;
  eacOneOffDays: number;
  eacTrendDays: number;
  etcDays: number;
  maskingWarning: boolean;
  byTeam: Record<
    string,
    {
      bacDays: number;
      bcwsDays: number;
      bcwpDays: number;
      acwpDays: number;
      cvDays: number;
      svDays: number;
      cpi: number;
      spi: number;
      maskingWarning: boolean;
    }
  >;
}

/**
 * Software Delivery Governance, Brooks's Law, Cross-Team Handoffs, Hypercare & Retro Calibration.
 */
export interface DeliveryGovernanceSummary {
  releaseMode: 'external-commit' | 'target-window' | 'continuous-delivery';
  slaBreachProbability: number;
  costOfDelayDevDays: number;
  brooksLawDiagnostic?: {
    communicationChannelsBefore: number;
    communicationChannelsAfter: number;
    onboardingPenaltyDays: number;
    netAccelerationDays: number;
    warning?: string;
  };
  overallocatedAssignees: Array<{
    assignee: string;
    concurrentIssues: string[];
    utilizationPct: number;
  }>;
  blockedHandoffIdleDays: number;
  lateChangeEscalationFactor: number;
  stageGateNodes: string[];
  hypercareReserveDays: number;
  sprintReadinessScore: number;
  lessonsLearntCalibration: {
    completedCount: number;
    empiricalVelocityRatio: number;
    recommendedSigmaMultiplier: number;
    summary: string;
  };
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
  /** Nodes with negative total float relative to the target goal deadline */
  superCriticalNodes?: string[];
  blastRadiusNodes: string[];
  rippleDelayDays: number;
  iterations: number;
  executionTimeMs: number;
  referenceDate: string;
  intervenedNodeKey?: string;
  interventionDeltaDays?: number;
  addDeveloper?: boolean;
  decoupleBlockingEdges?: boolean;
  trimScope?: boolean;
  nodeStats: Record<string, NodeSimulationStats>;
  goalImpacts: GoalImpact[];
  topBottlenecks: BottleneckDiagnostic[];
  distributionBuckets: ProbabilityConeBucket[];
  timeMachineEpochs: TimeMachineEpoch[];
  /** Three-tier schedule buffer decomposition */
  reserves?: ReserveBreakdown;
  /** Hierarchical Engineering Earned Value in Dev-Days */
  earnedValue?: EarnedValueSummary;
  /** Software Delivery Governance, Brooks's Law, Handoffs & Retro Calibration */
  deliveryGovernance?: DeliveryGovernanceSummary;
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
 * Centralized simulation bounds and defensive input validation helpers.
 */
export const SIMULATION_BOUNDS = {
  MIN_DELAY_DAYS: -5,
  MAX_DELAY_DAYS: 60,
  MIN_UNAVAILABLE_DAYS: -3,
  MAX_UNAVAILABLE_DAYS: 15,
  MAX_OVERRIDE_ENTRIES: 50,
  MAX_COMPOUND_JSON_BYTES: 16_384,
  MAX_MCP_BODY_BYTES: 65_536,
} as const;

const RESERVED_OBJECT_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

/**
 * Returns true if `key` is a JavaScript prototype-polluting property name.
 */
export function isReservedObjectKey(key: string): boolean {
  return RESERVED_OBJECT_KEYS.has(key);
}

/**
 * Clamps a schedule shift (`deltaDays` / `delayDays`) to `[-5, 60]` with NaN/Infinity fallback.
 */
export function clampDelayDays(val: unknown, fallback = 0): number {
  const num = val !== undefined && val !== null && val !== '' ? Number(val) : NaN;
  const base = Number.isFinite(num) ? num : fallback;
  return Math.max(
    SIMULATION_BOUNDS.MIN_DELAY_DAYS,
    Math.min(SIMULATION_BOUNDS.MAX_DELAY_DAYS, base)
  );
}

/**
 * Clamps an assignee unavailability shift (`unavailableDays`) to `[-3, 15]` with NaN/Infinity fallback.
 */
export function clampUnavailableDays(val: unknown, fallback = 0): number {
  const num = val !== undefined && val !== null && val !== '' ? Number(val) : NaN;
  const base = Number.isFinite(num) ? num : fallback;
  return Math.max(
    SIMULATION_BOUNDS.MIN_UNAVAILABLE_DAYS,
    Math.min(SIMULATION_BOUNDS.MAX_UNAVAILABLE_DAYS, base)
  );
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
    resolutiondate?: string | null;
    timetracking?: {
      originalEstimateSeconds?: number;
      remainingEstimateSeconds?: number;
      timeSpentSeconds?: number;
    } | null;
    timeoriginalestimate?: number | null;
    timeestimate?: number | null;
    timespent?: number | null;
    customfield_10016?: number | null; // Story points
    customfield_10001?: { name?: string; title?: string } | string | null; // Atlassian Team field
    customfield_10021?: unknown[] | null; // Jira Kanban Flagged / Impediment field
    components?: Array<{
      id?: string;
      name?: string;
    }>;
    labels?: string[];
    issuelinks?: RawJiraIssueLink[];
    parent?: {
      id?: string;
      key?: string;
      fields?: { summary?: string };
    };
    subtasks?: Array<{
      id?: string;
      key?: string;
      fields?: {
        summary?: string;
        status?: { name?: string };
      };
    }>;
  };
}
