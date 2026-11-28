/**
 * Project World Model (PWM) — Atlassian Rovo Agent Action Handlers (`src/rovo/actions.ts`)
 *
 * Implements the three `rovo:action` functions registered in `manifest.yml`:
 * 1. `simulateDelayImpact` (`simulateDelayImpactHandler`)
 * 2. `analyzeCriticalPath` (`analyzeCriticalPathHandler`)
 * 3. `seedDemoScenario`    (`seedDemoScenarioHandler`)
 */

import { runIntervention, runMonteCarloSimulation } from '../engine/simulator';
import {
  AssigneeInterventionOverride,
  CausalGraph,
  NodeInterventionOverride,
  SIMULATION_BOUNDS,
  clampDelayDays,
  clampUnavailableDays,
  isReservedObjectKey,
} from '../engine/types';
import { fetchProjectCausalGraph } from '../twg/graphFetcher';
import { seedProjectChronosScenario } from '../twg/syntheticSeeder';

export interface RovoActionContext {
  cloudId?: string;
  installContext?: string;
  accountId?: string;
  issueKey?: string;
  jira?: {
    projectKey?: string;
    issueKey?: string;
  };
}

export interface RovoSimulateDelayPayload {
  issueKey?: string;
  delayDays?: number | string;
  addDeveloper?: boolean;
  decoupleBlockingEdges?: boolean;
  trimScope?: boolean;
  assigneeName?: string;
  unavailableDays?: number | string;
  personMitigation?: string;
  reassignBottleneck?: boolean;
  serializeParallelWork?: boolean;
  pairOnTopBlocker?: boolean;
  compoundOverridesJson?: string;
  nodeOverrides?: Record<string, NodeInterventionOverride>;
  assigneeOverrides?: Record<string, AssigneeInterventionOverride>;
  projectKey?: string;
  cloudId?: string;
  authMode?: 'user' | 'app';
  context?: RovoActionContext;
}

export interface RovoAnalyzeCriticalPathPayload {
  projectKey?: string;
  cloudId?: string;
  authMode?: 'user' | 'app';
  context?: RovoActionContext;
}

export interface RovoSeedDemoPayload {
  projectKey?: string;
  populateJiraIssues?: boolean;
  authMode?: 'user' | 'app';
  context?: RovoActionContext;
}

function sanitizeForLlmText(raw: string | undefined | null, maxLen = 120): string {
  const cleaned = String(raw ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[`<>]/g, '')
    .replace(/(^|\s)#+\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen - 1)}…`;
}

function extractActionCloudId(
  payload: { cloudId?: string; context?: RovoActionContext },
  context?: RovoActionContext
): string | undefined {
  // Always prioritize Forge platform-verified context cloudId before caller payload
  const candidates = [context?.cloudId, payload.context?.cloudId, payload.cloudId];
  for (const raw of candidates) {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (
        trimmed.length > 0 &&
        trimmed !== 'current' &&
        /^[a-zA-Z0-9-]{8,64}$/.test(trimmed)
      ) {
        return trimmed;
      }
    }
  }
  return undefined;
}

function resolveCanonicalAssigneeName(
  graph: CausalGraph,
  rawAssignee: string
): string {
  const target = rawAssignee.trim().toLowerCase();
  if (!target) return rawAssignee.trim();

  const exact = graph.nodes.find(
    (n) => n.assignee && n.assignee.trim().toLowerCase() === target
  );
  if (exact?.assignee) return exact.assignee;

  const partial = graph.nodes.find(
    (n) => n.assignee && n.assignee.trim().toLowerCase().includes(target)
  );
  if (partial?.assignee) return partial.assignee;

  return rawAssignee.trim();
}

function resolveDefaultTargetIssueKey(
  graph: CausalGraph,
  assigneeName?: string
): string {
  if (assigneeName) {
    const lower = assigneeName.trim().toLowerCase();
    const matchingNodes = graph.nodes.filter(
      (n) => n.assignee && n.assignee.trim().toLowerCase() === lower
    );
    const nonDoneSorted = matchingNodes
      .filter((n) => n.status.toLowerCase() !== 'done')
      .sort((a, b) => b.baseEstimateDays - a.baseEstimateDays);
    if (nonDoneSorted[0]?.key) return nonDoneSorted[0].key;
    if (matchingNodes[0]?.key) return matchingNodes[0].key;
  }

  if (graph.nodes.length > 0) {
    const baseline = runMonteCarloSimulation(graph, { iterations: 100 });
    if (baseline.topBottlenecks[0]?.key) {
      return baseline.topBottlenecks[0].key;
    }
  }

  return (
    graph.topologicalOrder[0] ||
    graph.nodes[0]?.key ||
    `${graph.projectKey}-1`
  );
}

function sanitizeNodeOverridesMap(
  input?: Record<string, NodeInterventionOverride>
): Record<string, NodeInterventionOverride> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const clean: Record<string, NodeInterventionOverride> = Object.create(null);
  let count = 0;
  for (const [key, val] of Object.entries(input)) {
    const cleanKey = key.trim();
    if (!cleanKey || isReservedObjectKey(cleanKey) || !val || typeof val !== 'object' || Array.isArray(val)) {
      continue;
    }
    if (++count > SIMULATION_BOUNDS.MAX_OVERRIDE_ENTRIES) break;
    clean[cleanKey] = {
      deltaDays: clampDelayDays(val.deltaDays, 0),
      addDeveloper: Boolean(val.addDeveloper),
      decoupleBlockingEdges: Boolean(val.decoupleBlockingEdges),
      trimScope: Boolean(val.trimScope),
    };
  }
  return clean;
}

function sanitizeAssigneeOverridesMap(
  input?: Record<string, AssigneeInterventionOverride>
): Record<string, AssigneeInterventionOverride> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const clean: Record<string, AssigneeInterventionOverride> = Object.create(null);
  let count = 0;
  for (const [key, val] of Object.entries(input)) {
    const cleanKey = key.trim();
    if (!cleanKey || isReservedObjectKey(cleanKey) || !val || typeof val !== 'object' || Array.isArray(val)) {
      continue;
    }
    if (++count > SIMULATION_BOUNDS.MAX_OVERRIDE_ENTRIES) break;
    clean[cleanKey] = {
      assignee: (val.assignee || cleanKey).trim(),
      unavailableDays: clampUnavailableDays(val.unavailableDays, 0),
      reassignBottleneck: Boolean(val.reassignBottleneck),
      serializeParallelWork: Boolean(val.serializeParallelWork),
      pairOnTopBlocker: Boolean(val.pairOnTopBlocker),
    };
  }
  return clean;
}

function parseCompoundOverridesJson(
  rawJson?: string
): Record<string, NodeInterventionOverride> {
  if (
    typeof rawJson !== 'string' ||
    rawJson.trim().length === 0 ||
    rawJson.length > SIMULATION_BOUNDS.MAX_COMPOUND_JSON_BYTES
  ) {
    return {};
  }
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const clean: Record<string, NodeInterventionOverride> = Object.create(null);
    let count = 0;
    for (const [key, val] of Object.entries(parsed as Record<string, unknown>)) {
      const cleanKey = key.trim();
      if (!cleanKey || isReservedObjectKey(cleanKey) || !val || typeof val !== 'object' || Array.isArray(val)) {
        continue;
      }
      if (++count > SIMULATION_BOUNDS.MAX_OVERRIDE_ENTRIES) break;
      const obj = val as Record<string, unknown>;
      clean[cleanKey] = {
        deltaDays: clampDelayDays(obj.deltaDays, 0),
        addDeveloper: Boolean(obj.addDeveloper),
        decoupleBlockingEdges: Boolean(obj.decoupleBlockingEdges),
        trimScope: Boolean(obj.trimScope),
      };
    }
    return clean;
  } catch {
    return {};
  }
}

/**
 * Rovo Action 1: `simulateDelayImpact(payload, context)`
 * Extracts issue/person/compound counterfactual parameters, runs `runIntervention`,
 * and returns a structured, markdown-formatted causal report showing P50/P85/P95 date shifts,
 * blast radius issues, affected Goals, and concrete mitigation recommendations.
 */
export async function simulateDelayImpact(
  payload: RovoSimulateDelayPayload = {},
  context?: RovoActionContext
) {
  const projectKey =
    payload.projectKey ||
    payload.context?.jira?.projectKey ||
    context?.jira?.projectKey;
  const cloudId = extractActionCloudId(payload, context);
  const authMode = payload.authMode ?? 'user';

  const graph = await fetchProjectCausalGraph({ projectKey, cloudId, authMode });

  const rawAssignee =
    typeof payload.assigneeName === 'string' ? payload.assigneeName.trim() : '';
  const canonicalAssignee = rawAssignee
    ? resolveCanonicalAssigneeName(graph, rawAssignee)
    : '';

  const parsedCompound = parseCompoundOverridesJson(payload.compoundOverridesJson);
  const sanitizedPayloadNodes = sanitizeNodeOverridesMap(payload.nodeOverrides);
  const effectiveNodeOverrides: Record<string, NodeInterventionOverride> = {
    ...parsedCompound,
    ...sanitizedPayloadNodes,
  };

  const effectiveAssigneeOverrides: Record<string, AssigneeInterventionOverride> =
    sanitizeAssigneeOverridesMap(payload.assigneeOverrides);

  if (canonicalAssignee && !isReservedObjectKey(canonicalAssignee)) {
    const mitigationTokens =
      typeof payload.personMitigation === 'string'
        ? payload.personMitigation.toLowerCase()
        : '';
    const unavailableDays = clampUnavailableDays(payload.unavailableDays, 0);
    effectiveAssigneeOverrides[canonicalAssignee] = {
      assignee: canonicalAssignee,
      unavailableDays,
      reassignBottleneck:
        Boolean(payload.reassignBottleneck) || mitigationTokens.includes('reassign'),
      serializeParallelWork:
        Boolean(payload.serializeParallelWork) || mitigationTokens.includes('serialize'),
      pairOnTopBlocker:
        Boolean(payload.pairOnTopBlocker) || mitigationTokens.includes('pair'),
    };
  }

  const issueKey =
    (typeof payload.issueKey === 'string' && payload.issueKey.trim()) ||
    payload.context?.issueKey ||
    payload.context?.jira?.issueKey ||
    context?.issueKey ||
    context?.jira?.issueKey ||
    resolveDefaultTargetIssueKey(graph, canonicalAssignee || undefined);

  const hasMitigationOrCompound =
    Boolean(payload.addDeveloper) ||
    Boolean(payload.decoupleBlockingEdges) ||
    Boolean(payload.trimScope) ||
    Object.keys(effectiveNodeOverrides).length > 0 ||
    Object.keys(effectiveAssigneeOverrides).length > 0;

  const hasExplicitDelay =
    payload.delayDays !== undefined && payload.delayDays !== '';
  const delayDays = clampDelayDays(
    payload.delayDays,
    hasExplicitDelay ? 7 : hasMitigationOrCompound ? 0 : 7
  );

  const result = runIntervention(graph, issueKey, delayDays, {
    iterations: 500,
    addDeveloper: payload.addDeveloper,
    decoupleBlockingEdges: payload.decoupleBlockingEdges,
    trimScope: payload.trimScope,
    nodeOverrides:
      Object.keys(effectiveNodeOverrides).length > 0
        ? effectiveNodeOverrides
        : undefined,
    assigneeOverrides:
      Object.keys(effectiveAssigneeOverrides).length > 0
        ? effectiveAssigneeOverrides
        : undefined,
  });

  const formatSigned = (n: number) => (n >= 0 ? `+${n}d` : `${n}d`);

  const affectedGoalsSummary = result.goalImpacts
    .map(
      (g) =>
        `• **${sanitizeForLlmText(g.goalName)}** (${sanitizeForLlmText(g.goalKey, 40)}): ${g.baselineP85Date} → **${g.p85CompletionDate}** (${formatSigned(g.rippleDelayDays)} shift, status: **${g.status}**, on-time prob: ${Math.round(g.probabilityOfOnTime * 100)}%)`
    )
    .join('\n');

  const topCascades = result.nodeDeltas
    .filter((d) => d.key !== result.targetNodeKey && Math.abs(d.shiftDays) > 0)
    .slice(0, 6)
    .map(
      (d) =>
        `• **${sanitizeForLlmText(d.key, 32)}** (${sanitizeForLlmText(d.team, 48)}): ${sanitizeForLlmText(d.summary)} → shifts **${formatSigned(d.shiftDays)}** to ${d.intervenedP85Date} (weight: ${d.effectiveWeight})`
    )
    .join('\n');

  const mitigationRecommendations = [
    `1. **Swarm Resource (+1 Engineer on ${result.targetNodeKey}):** Adding a pairing engineer compresses base estimate by ~35% and reduces variance σ by 40%, recovering up to ${Math.max(2, Math.round(Math.abs(result.p85ShiftDays) * 0.45))} days on the Target Commit Date (85% safe).`,
    `2. **Decouple Cross-Team Blocking Edge:** Introduce an API/interface mock contract out of **${result.targetNodeKey}** to drop downstream propagation weight from 1.0 to 0.25 and shield ${result.blastRadiusNodes.slice(0, 3).join(', ') || 'downstream teams'}.`,
    `3. **Protect Critical Path Slack:** Prioritize ${result.criticalPathNodes.slice(0, 4).join(' → ')} during daily standups to prevent secondary compound tail risk.`,
  ];

  const activeMitigations: string[] = [];
  if (payload.addDeveloper) activeMitigations.push('+1 Developer (Brooks Law adjusted)');
  if (payload.decoupleBlockingEdges) activeMitigations.push('Decouple Blocking Edges');
  if (payload.trimScope) activeMitigations.push('Trim Scope (MVP)');

  const nodeOverrideKeys = Object.keys(effectiveNodeOverrides);
  const assigneeOverrideKeys = Object.keys(effectiveAssigneeOverrides);
  const compoundClauses: string[] = [];
  if (nodeOverrideKeys.length > 0) {
    compoundClauses.push(`Issues [${nodeOverrideKeys.join(', ')}]`);
  }
  if (assigneeOverrideKeys.length > 0) {
    compoundClauses.push(`People [${assigneeOverrideKeys.join(', ')}]`);
  }

  const summaryMarkdown = [
    `### Counterfactual Simulation: \`do(${sanitizeForLlmText(result.targetNodeKey, 32)} = ${formatSigned(result.deltaDays)})\``,
    `**Target Task:** ${sanitizeForLlmText(result.targetNodeKey, 32)} — *${sanitizeForLlmText(result.targetNodeSummary)}*`,
    ...(activeMitigations.length > 0
      ? [`**Active Mitigations:** ${activeMitigations.join(' · ')}`]
      : []),
    ...(compoundClauses.length > 0
      ? [`**Compound Overrides:** ${sanitizeForLlmText(compoundClauses.join(' + '), 240)}`]
      : []),
    `**Simulation Engine:** 500-iteration Paired Twin-Network Monte Carlo (${result.executionTimeMs} ms)`,
    '',
    `#### Release Forecast Shift`,
    `- **Likely Finish (50% odds):** ${result.baseline.p50Date} → **${result.intervened.p50Date}** (${formatSigned(result.p50ShiftDays)})`,
    `- **Target Commit Date (85% safe):** ${result.baseline.p85Date} → **${result.intervened.p85Date}** (${formatSigned(result.p85ShiftDays)})`,
    `- **Safe Buffer Date (95% cutoff):** ${result.baseline.p95Date} → **${result.intervened.p95Date}** (${formatSigned(result.p95ShiftDays)})`,
    `- **Blast Radius:** **${result.blastRadiusNodes.length}** downstream tasks impacted (\`${result.blastRadiusNodes.join(', ')}\`)`,
    '',
    `#### Teamwork Graph (TWG) Goal Impact`,
    affectedGoalsSummary,
    '',
    `#### Top Downstream Ripple Tasks`,
    topCascades || '• No downstream tasks shifted (task has sufficient float/slack).',
    '',
    `#### Concrete Mitigation Recommendations`,
    ...mitigationRecommendations,
  ].join('\n');

  return {
    action: 'simulate-delay-impact',
    projectKey: graph.projectKey,
    isSyntheticDemo: graph.isSyntheticDemo,
    targetNodeKey: result.targetNodeKey,
    targetNodeSummary: result.targetNodeSummary,
    delayDays: result.deltaDays,
    p50Date: result.p50Date,
    p85Date: result.p85Date,
    p95Date: result.p95Date,
    baseline: result.baseline,
    intervened: result.intervened,
    p50ShiftDays: result.p50ShiftDays,
    p85ShiftDays: result.p85ShiftDays,
    p95ShiftDays: result.p95ShiftDays,
    rippleDelayDays: result.rippleDelayDays,
    criticalPathNodes: result.criticalPathNodes,
    superCriticalNodes: result.superCriticalNodes,
    blastRadiusNodes: result.blastRadiusNodes,
    goalImpacts: result.goalImpacts,
    nodeDeltas: result.nodeDeltas,
    reserves: result.reserves,
    earnedValue: result.earnedValue,
    deliveryGovernance: result.deliveryGovernance,
    mitigationRecommendations,
    executionTimeMs: result.executionTimeMs,
    summaryMarkdown,
  };
}

/**
 * Rovo Action 2: `analyzeCriticalPath(payload, context)`
 * Computes the topological critical path and top 3 bottleneck nodes with the highest downstream ripple weight.
 */
export async function analyzeCriticalPath(
  payload: RovoAnalyzeCriticalPathPayload = {},
  context?: RovoActionContext
) {
  const projectKey =
    payload.projectKey ||
    payload.context?.jira?.projectKey ||
    context?.jira?.projectKey;
  const cloudId = extractActionCloudId(payload, context);
  const authMode = payload.authMode ?? 'user';

  const graph = await fetchProjectCausalGraph({ projectKey, cloudId, authMode });
  const sim = runMonteCarloSimulation(graph, { iterations: 500 });

  // Sort specifically to highlight the top 3 bottleneck nodes with highest downstream ripple weight & risk
  const topByRipple = [...sim.topBottlenecks].sort(
    (a, b) => b.downstreamRippleWeight - a.downstreamRippleWeight || b.riskScore - a.riskScore
  );
  const top3Bottlenecks = topByRipple.slice(0, 3);
  const top5 = sim.topBottlenecks.slice(0, 5);

  const bottleneckLines = top3Bottlenecks
    .map(
      (b, idx) =>
        `${idx + 1}. **${sanitizeForLlmText(b.key, 32)}** — *${sanitizeForLlmText(b.summary)}* (${sanitizeForLlmText(b.team, 48)}, Assignee: ${sanitizeForLlmText(b.assignee, 48)})\n   - **Downstream Ripple Weight:** ${b.downstreamRippleWeight} (${b.downstreamCount} dependent tasks) | **Criticality Index:** ${Math.round(b.criticalityIndex * 100)}% | **Mitigation ROI:** ${b.mitigationROI ?? 1.5}x | **Risk Score:** ${b.riskScore}/100\n   - **Mitigation:** ${sanitizeForLlmText(b.recommendation, 180)}`
    )
    .join('\n');

  const summaryMarkdown = [
    `### Rovo-World-Model — Critical Path & Delivery Governance (${sanitizeForLlmText(graph.projectName, 80)})`,
    `- **Likely Finish (50% odds / Core Work Estimate):** ${sim.p50Date} (+${sim.p50Days}d)`,
    `- **Target Commit Date (85% safe):** **${sim.p85Date}** (+${sim.p85Days}d, Team Risk Buffer: +${sim.reserves?.pmContingencyReserveDays ?? 0}d)`,
    `- **Safe Buffer Date (95% cutoff):** ${sim.p95Date} (+${sim.p95Days}d, Executive Contingency: +${sim.reserves?.managementReserveDays ?? 0}d)`,
    `- **Engineering Earned Value (EVM):** CPI **${sim.earnedValue?.cpi ?? 1.0}** · SPI **${sim.earnedValue?.spi ?? 1.0}** · Forecast EAC **${sim.earnedValue?.eacTrendDays ?? sim.p50Days}d**`,
    `- **Topological Critical Path (${sim.criticalPathNodes.length} nodes):** \`${sim.criticalPathNodes.join(' → ')}\``,
    '',
    `#### Top 3 Bottleneck Nodes by Downstream Ripple Weight`,
    bottleneckLines,
  ].join('\n');

  return {
    action: 'analyze-critical-path',
    projectKey: graph.projectKey,
    projectName: graph.projectName,
    source: graph.source,
    isSyntheticDemo: graph.isSyntheticDemo,
    p50Date: sim.p50Date,
    p85Date: sim.p85Date,
    p95Date: sim.p95Date,
    criticalPathNodes: sim.criticalPathNodes,
    superCriticalNodes: sim.superCriticalNodes,
    topologicalOrder: graph.topologicalOrder,
    top3Bottlenecks,
    topBottlenecks: top5,
    goalImpacts: sim.goalImpacts,
    reserves: sim.reserves,
    earnedValue: sim.earnedValue,
    deliveryGovernance: sim.deliveryGovernance,
    cycleWarnings: graph.cycleWarnings,
    executionTimeMs: sim.executionTimeMs,
    summaryMarkdown,
  };
}

/**
 * Rovo Action 3: `seedDemoScenario(payload, context)`
 * Loads the 18-node "Project Chronos: Next-Gen Platform Launch" dataset into Forge storage and confirms readiness.
 */
export async function seedDemoScenario(
  payload: RovoSeedDemoPayload = {},
  context?: RovoActionContext
) {
  const projectKey =
    payload.projectKey ||
    payload.context?.jira?.projectKey ||
    context?.jira?.projectKey ||
    'CHRON';
  const populateJiraIssues = Boolean(payload.populateJiraIssues);

  const report = await seedProjectChronosScenario({
    projectKey,
    populateJiraIssues,
    authMode: payload.authMode ?? 'user',
  });

  const baselineSim = runMonteCarloSimulation(report.graph, { iterations: 500 });

  return {
    action: 'seed-demo-scenario',
    ready: true,
    mode: report.mode,
    projectKey: report.projectKey,
    projectName: report.graph.projectName,
    isSyntheticDemo: report.graph.isSyntheticDemo,
    nodesCount: report.graph.nodes.length,
    edgesCount: report.graph.edges.length,
    teamsCount: report.graph.teams.length,
    goalsCount: report.graph.goals.length,
    createdIssuesCount: report.createdIssuesCount,
    createdLinksCount: report.createdLinksCount,
    p50Date: baselineSim.p50Date,
    p85Date: baselineSim.p85Date,
    p95Date: baselineSim.p95Date,
    criticalPathNodes: baselineSim.criticalPathNodes,
    topBottleneck: baselineSim.topBottlenecks[0] ?? null,
    message: report.message,
  };
}

export const simulateDelayImpactHandler = simulateDelayImpact;
export const analyzeCriticalPathHandler = analyzeCriticalPath;
export const seedDemoScenarioHandler = seedDemoScenario;
