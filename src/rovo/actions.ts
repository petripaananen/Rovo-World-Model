/**
 * Project World Model (PWM) — Atlassian Rovo Agent Action Handlers (`src/rovo/actions.ts`)
 *
 * Implements the three `rovo:action` functions registered in `manifest.yml`:
 * 1. `simulateDelayImpact` (`simulateDelayImpactHandler`)
 * 2. `analyzeCriticalPath` (`analyzeCriticalPathHandler`)
 * 3. `seedDemoScenario`    (`seedDemoScenarioHandler`)
 */

import { runIntervention, runMonteCarloSimulation } from '../engine/simulator';
import { fetchProjectCausalGraph } from '../twg/graphFetcher';
import { seedProjectChronosScenario } from '../twg/syntheticSeeder';

export interface RovoActionContext {
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
  projectKey?: string;
  context?: RovoActionContext;
}

export interface RovoAnalyzeCriticalPathPayload {
  projectKey?: string;
  context?: RovoActionContext;
}

export interface RovoSeedDemoPayload {
  projectKey?: string;
  populateJiraIssues?: boolean;
  context?: RovoActionContext;
}

/**
 * Rovo Action 1: `simulateDelayImpact(payload, context)`
 * Extracts `issueKey` and `delayDays`, runs `runIntervention(graph, issueKey, delayDays)`,
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
    context?.jira?.projectKey ||
    'CHRON';
  const issueKey =
    payload.issueKey ||
    payload.context?.jira?.issueKey ||
    context?.jira?.issueKey ||
    `${projectKey.toUpperCase()}-104`;
  const delayDays = Math.max(-5, Math.min(90, Number(payload.delayDays ?? 7) || 7));

  const graph = await fetchProjectCausalGraph({ projectKey });
  const result = runIntervention(graph, issueKey, delayDays, {
    iterations: 500,
    addDeveloper: payload.addDeveloper,
    decoupleBlockingEdges: payload.decoupleBlockingEdges,
  });

  const formatSigned = (n: number) => (n >= 0 ? `+${n}d` : `${n}d`);

  const affectedGoalsSummary = result.goalImpacts
    .map(
      (g) =>
        `• **${g.goalName}** (${g.goalKey}): ${g.baselineP85Date} → **${g.p85CompletionDate}** (${formatSigned(g.rippleDelayDays)} shift, status: **${g.status}**, on-time prob: ${Math.round(g.probabilityOfOnTime * 100)}%)`
    )
    .join('\n');

  const topCascades = result.nodeDeltas
    .filter((d) => d.key !== result.targetNodeKey && Math.abs(d.shiftDays) > 0)
    .slice(0, 6)
    .map(
      (d) =>
        `• **${d.key}** (${d.team}): ${d.summary} → shifts **${formatSigned(d.shiftDays)}** to ${d.intervenedP85Date} (weight: ${d.effectiveWeight})`
    )
    .join('\n');

  const mitigationRecommendations = [
    `1. **Swarm Resource (+1 Engineer on ${result.targetNodeKey}):** Adding a pairing engineer compresses base estimate by ~35% and reduces variance σ by 40%, recovering up to ${Math.max(2, Math.round(Math.abs(result.p85ShiftDays) * 0.45))} days on the P85 commit date.`,
    `2. **Decouple Cross-Team Blocking Edge:** Introduce an API/interface mock contract out of **${result.targetNodeKey}** to drop downstream propagation weight from 1.0 to 0.25 and shield ${result.blastRadiusNodes.slice(0, 3).join(', ') || 'downstream teams'}.`,
    `3. **Protect Critical Path Slack:** Prioritize ${result.criticalPathNodes.slice(0, 4).join(' → ')} during daily standups to prevent secondary compound tail risk.`,
  ];

  const summaryMarkdown = [
    `### Counterfactual Simulation: \`do(${result.targetNodeKey} = ${formatSigned(result.deltaDays)})\``,
    `**Target Task:** ${result.targetNodeKey} — *${result.targetNodeSummary}*`,
    `**Simulation Engine:** 500-iteration Paired Twin-Network Monte Carlo (${result.executionTimeMs} ms)`,
    '',
    `#### Release Forecast Shift`,
    `- **P50 (Median):** ${result.baseline.p50Date} → **${result.intervened.p50Date}** (${formatSigned(result.p50ShiftDays)})`,
    `- **P85 (Commit):** ${result.baseline.p85Date} → **${result.intervened.p85Date}** (${formatSigned(result.p85ShiftDays)})`,
    `- **P95 (Tail Risk):** ${result.baseline.p95Date} → **${result.intervened.p95Date}** (${formatSigned(result.p95ShiftDays)})`,
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
    blastRadiusNodes: result.blastRadiusNodes,
    goalImpacts: result.goalImpacts,
    nodeDeltas: result.nodeDeltas,
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
    context?.jira?.projectKey ||
    'CHRON';

  const graph = await fetchProjectCausalGraph({ projectKey });
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
        `${idx + 1}. **${b.key}** — *${b.summary}* (${b.team}, Assignee: ${b.assignee})\n   - **Downstream Ripple Weight:** ${b.downstreamRippleWeight} (${b.downstreamCount} dependent tasks) | **Criticality Index:** ${Math.round(b.criticalityIndex * 100)}% | **Risk Score:** ${b.riskScore}/100\n   - **Mitigation:** ${b.recommendation}`
    )
    .join('\n');

  const summaryMarkdown = [
    `### Project World Model — Critical Path & Top 3 Bottlenecks (${graph.projectName})`,
    `- **P50 Completion:** ${sim.p50Date} (+${sim.p50Days}d)`,
    `- **P85 Commit Target:** **${sim.p85Date}** (+${sim.p85Days}d)`,
    `- **P95 Tail Envelope:** ${sim.p95Date} (+${sim.p95Days}d)`,
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
    topologicalOrder: graph.topologicalOrder,
    top3Bottlenecks,
    topBottlenecks: top5,
    goalImpacts: sim.goalImpacts,
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
