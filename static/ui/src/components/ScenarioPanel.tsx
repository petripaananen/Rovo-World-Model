/**
 * Step 4 Component 4: Atlassian Jira-Native What-If Simulator Panel (`static/ui/src/components/ScenarioPanel.tsx`)
 *
 * Designed via Stitch MCP (`StitchMCP`) & Atlassian Design System (ADS):
 * - Looks and behaves like a native Jira Cloud Issue Detail & Rovo Insights drawer.
 * - Rectangular ADS status lozenges (`TO DO`, `IN PROGRESS`, `DONE`, `AT RISK`).
 * - Step 1: Schedule Change Slider (`-5d` to `+30d`) + Mitigation Toggles (`Add Developer`, `Decouple Dependency`).
 * - Step 2: Release Date Comparison Bars + Solid Atlassian Blue (`#0C66E4`) `Ask @Rovo-World-Model Agent` button.
 * - Step 3: Teamwork Graph Goals & Inspector Tabs (`Impacted Issues`, `Top Blockers`, `Math & MCP Spec`).
 */

import {
  AssigneeInterventionOverride,
  CausalGraph,
  InterventionResult,
  NodeInterventionOverride,
  SimulationResult,
} from '../../../../src/engine/types';
import { MCP_TOOLS_MANIFEST } from '../../../../src/mcp/server';
import {
  escapeHtmlText,
  formatFriendlyDate,
  renderDragHandleBadge,
  renderInfoTooltip,
  renderJiraStatusLozenge,
} from './tooltip';

export interface ScenarioPanelProps {
  graph: CausalGraph;
  baselineSim: SimulationResult;
  activeSim: SimulationResult;
  intervention: InterventionResult | null;
  selectedNodeKey: string;
  delayDays: number;
  addDeveloper: boolean;
  decoupleBlockingEdges: boolean;
  trimScope: boolean;
  simulatorMode: 'issue' | 'person';
  pinnedNodeOverrides: Record<string, NodeInterventionOverride>;
  selectedAssignee: string;
  assigneeOverrides: Record<string, AssigneeInterventionOverride>;
  activeRightTab: 'cascade' | 'bottlenecks' | 'governance' | 'rovo-mcp';
  copiedPromptNotice: boolean;
}

function summarizeNodeOverride(ov: NodeInterventionOverride): string {
  const parts: string[] = [];
  if (ov.deltaDays > 0) parts.push(`+${ov.deltaDays}d`);
  else if (ov.deltaDays < 0) parts.push(`${ov.deltaDays}d`);
  if (ov.addDeveloper) parts.push('+Dev');
  if (ov.decoupleBlockingEdges) parts.push('Split');
  if (ov.trimScope) parts.push('MVP');
  return parts.join(' · ') || '0d';
}

function summarizeAssigneeOverride(aOv: AssigneeInterventionOverride): string {
  const parts: string[] = [];
  const uDays = Number(aOv.unavailableDays ?? 0);
  if (uDays > 0) parts.push(`+${uDays}d Away`);
  else if (uDays < 0) parts.push(`${uDays}d Focus`);
  if (aOv.reassignBottleneck) parts.push('Reassign');
  if (aOv.serializeParallelWork) parts.push('Serialize');
  if (aOv.pairOnTopBlocker) parts.push('Pair');
  return parts.join(' · ') || 'Active';
}

export function buildRovoMitigationPrompt(props: ScenarioPanelProps): string {
  const {
    graph,
    selectedNodeKey,
    delayDays,
    addDeveloper,
    decoupleBlockingEdges,
    trimScope,
    pinnedNodeOverrides,
    assigneeOverrides,
    activeSim,
  } = props;

  const scenarioClauses: string[] = [];
  const mergedNodes: Record<string, NodeInterventionOverride> = {
    ...pinnedNodeOverrides,
  };
  if (
    delayDays !== 0 ||
    addDeveloper ||
    decoupleBlockingEdges ||
    trimScope
  ) {
    mergedNodes[selectedNodeKey] = {
      deltaDays: delayDays,
      addDeveloper,
      decoupleBlockingEdges,
      trimScope,
    };
  }

  for (const [k, ov] of Object.entries(mergedNodes)) {
    const n = graph.nodes.find((item) => item.key === k);
    scenarioClauses.push(
      `issue ${k}${n ? ` ("${n.summary}")` : ''} [${summarizeNodeOverride(ov)}]`
    );
  }

  for (const [person, aOv] of Object.entries(assigneeOverrides)) {
    scenarioClauses.push(`person "${person}" [${summarizeAssigneeOverride(aOv)}]`);
  }

  const node = graph.nodes.find((n) => n.key === selectedNodeKey) ?? graph.nodes[0];
  const goal = (node ? graph.goals.find((g) => g.id === node.goalId) : undefined) ?? graph.goals[0];

  if (!node) {
    return `@Rovo-World-Model Agent Project "${graph.projectName}" (${graph.projectKey}) currently has 0 issues. Populate sample linked Jira issues or add issues in Jira to run Monte Carlo dependency forecasting.`;
  }

  if (scenarioClauses.length > 1) {
    return `@Rovo-World-Model Agent In project "${graph.projectName}" (${graph.projectKey}), run a combined counterfactual simulation for: ${scenarioClauses.join(' + ')}. Projected Target Commit Date (85% safe) is ${activeSim.p85Date} with ${activeSim.blastRadiusNodes.length} impacted downstream issues affecting "${goal?.name ?? 'Sprint Delivery'}". Recommend a concrete mitigation plan.`;
  }

  const shiftStr =
    delayDays >= 0
      ? `delayed by ${delayDays} days`
      : `accelerated by ${Math.abs(delayDays)} days`;
  const modifiers: string[] = [];
  if (addDeveloper) modifiers.push('adding +1 developer');
  if (decoupleBlockingEdges) modifiers.push('decoupling outgoing blocking dependencies');
  if (trimScope) modifiers.push('trimming non-essential scope to ship an MVP');
  const modSuffix = modifiers.length > 0 ? ` while ${modifiers.join(' and ')}` : '';

  if (scenarioClauses.length === 1 && Object.keys(assigneeOverrides).length === 1) {
    return `@Rovo-World-Model Agent In project "${graph.projectName}" (${graph.projectKey}), simulate workload impact for ${scenarioClauses[0]} towards our "${goal?.name ?? 'Sprint Delivery'}" goal. Projected release date is ${activeSim.p85Date} with ${activeSim.blastRadiusNodes.length} impacted downstream issues. Recommend a concrete mitigation plan.`;
  }

  return `@Rovo-World-Model Agent In project "${graph.projectName}" (${graph.projectKey}), simulate what happens to our "${goal?.name ?? 'Sprint Delivery'}" goal if issue ${node.key} ("${node.summary}") is ${shiftStr}${modSuffix}. Projected release date is ${activeSim.p85Date} with ${activeSim.blastRadiusNodes.length} impacted downstream issues. Recommend a concrete mitigation plan.`;
}

function renderTabBody(props: ScenarioPanelProps): string {
  const {
    activeRightTab,
    activeSim,
    intervention,
    graph,
    selectedNodeKey,
    delayDays,
    addDeveloper,
    decoupleBlockingEdges,
    trimScope,
    pinnedNodeOverrides,
    assigneeOverrides,
  } = props;

  const hasActiveIntervention =
    delayDays !== 0 ||
    addDeveloper ||
    decoupleBlockingEdges ||
    trimScope ||
    Object.keys(pinnedNodeOverrides).length > 0 ||
    Object.keys(assigneeOverrides).length > 0;

  if (activeRightTab === 'cascade') {
    const deltas =
      intervention?.nodeDeltas.filter(
        (d) =>
          (Object.keys(pinnedNodeOverrides).length > 1 ||
            Object.keys(assigneeOverrides).length > 0 ||
            d.key !== selectedNodeKey) &&
          Math.abs(d.shiftDays) > 0
      ) ?? [];

    if (!hasActiveIntervention || deltas.length === 0) {
      return `
        <div class="empty-tab-notice">
          Adjust the <strong>Schedule Change Slider</strong> above or toggle a mitigation to preview downstream issue shifts in <strong>${escapeHtmlText(graph.projectName)}</strong>.
        </div>
      `;
    }

    const rows = deltas
      .map((d) => {
        const signStr = d.shiftDays > 0 ? `+${d.shiftDays}d` : `${d.shiftDays}d`;
        const lozClass = d.shiftDays > 0 ? 'jira-lozenge-danger' : 'jira-lozenge-done';
        return `
          <tr data-select-node="${escapeHtmlText(d.key)}" class="clickable-row" title="Click to inspect ${escapeHtmlText(d.key)} (${escapeHtmlText(d.summary)})">
            <td><strong class="jira-issue-key">${escapeHtmlText(d.key)}</strong></td>
            <td>${escapeHtmlText(d.summary.slice(0, 30))}${d.summary.length > 30 ? '…' : ''}</td>
            <td>${formatFriendlyDate(d.intervenedP85Date)}</td>
            <td><span class="jira-lozenge ${lozClass}">${signStr}</span></td>
          </tr>
        `;
      })
      .join('');

    return `
      <table class="cascade-table">
        <thead>
          <tr>
            <th>Issue</th>
            <th>Summary</th>
            <th>New Finish</th>
            <th>Shift</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  if (activeRightTab === 'bottlenecks') {
    return activeSim.topBottlenecks
      .slice(0, 5)
      .map(
        (b, idx) => `
        <div class="bottleneck-item" data-select-node="${escapeHtmlText(b.key)}" title="Click to select ${escapeHtmlText(b.key)} | Ripple Weight: ${b.downstreamRippleWeight}">
          <div class="bottleneck-row-top">
            <span>
              <strong class="text-brand">#${idx + 1} ${escapeHtmlText(b.key)}</strong>
              — <strong class="bottleneck-summary-title">${escapeHtmlText(b.summary)}</strong>
            </span>
            <span class="jira-lozenge jira-lozenge-inprogress">GATES ${b.downstreamCount}</span>
          </div>
          <div class="bottleneck-row-meta">
            <span>Assignee: <strong>${escapeHtmlText(b.assignee)}</strong> · Risk Score: <strong>${b.riskScore}/100</strong></span>
            <span>Float: <strong>${(b.totalFloatDays ?? 0).toFixed(1)}d</strong> · <span title="Schedule Leverage: ~${(b.mitigationROI ?? 1.0).toFixed(1)} days of release risk saved per 1 day of mitigation effort">Impact: <strong class="text-success">~${(b.mitigationROI ?? 1.0).toFixed(1)}d saved/d</strong></span></span>
          </div>
          <div class="bottleneck-row-rec">
            💡 ${escapeHtmlText(b.recommendation)}
          </div>
        </div>
      `
      )
      .join('');
  }

  if (activeRightTab === 'governance') {
    const res = activeSim.reserves;
    const evm = activeSim.earnedValue;
    const gov = activeSim.deliveryGovernance;

    const burnPct = res ? Math.round(res.bufferBurnRatio * 100) : 0;
    const burnLozenge =
      burnPct >= 80
        ? `<span class="jira-lozenge jira-lozenge-danger">${burnPct}% BURN</span>`
        : burnPct >= 50
          ? `<span class="jira-lozenge jira-lozenge-inprogress">${burnPct}% BURN</span>`
          : `<span class="jira-lozenge jira-lozenge-done">${burnPct}% BURN</span>`;

    const cpiVal = evm?.cpi ?? 1.0;
    const spiVal = evm?.spi ?? 1.0;
    const evmLozenge =
      evm?.maskingWarning
        ? `<span class="jira-lozenge jira-lozenge-danger">SQUAD VARIANCE ALERT</span>`
        : cpiVal < 0.9 || spiVal < 0.9
          ? `<span class="jira-lozenge jira-lozenge-inprogress">WATCH</span>`
          : `<span class="jira-lozenge jira-lozenge-done">HEALTHY</span>`;

    const squadRows = Object.entries(evm?.byTeam ?? {})
      .map(
        ([teamName, sq]) => `
          <div class="gov-squad-row">
            <span>${escapeHtmlText(teamName)}</span>
            <span>CPI <strong>${sq.cpi.toFixed(2)}</strong> · SPI <strong>${sq.spi.toFixed(2)}</strong></span>
          </div>
        `
      )
      .join('');

    const stageGateNodes = gov?.stageGateNodes ?? [];
    const retroCal = gov?.lessonsLearntCalibration;

    return `
      <div class="governance-grid">
        <!-- Card 1: 3-Tier Schedule Buffers & Hypercare -->
        <div class="gov-card">
          <div class="gov-card-header">
            <span>1. Schedule Buffers &amp; Hypercare</span>
            ${burnLozenge}
          </div>
          <div class="gov-stat-row">
            <span>Core Work Estimate: <strong>${(res?.baseTargetDays ?? activeSim.p50Days).toFixed(1)}d</strong></span>
            <span>Team Risk Buffer: <strong>+${(res?.pmContingencyReserveDays ?? 0).toFixed(1)}d</strong></span>
          </div>
          <div class="gov-stat-row">
            <span>Executive Contingency: <strong>+${(res?.managementReserveDays ?? 0).toFixed(1)}d</strong></span>
            <span>Hypercare Buffer: <strong>+${(gov?.hypercareReserveDays ?? 1.5).toFixed(1)}d</strong></span>
          </div>
        </div>

        <!-- Card 2: Engineering Earned Value (Dev-Days) -->
        <div class="gov-card">
          <div class="gov-card-header">
            <span>2. Engineering Earned Value (Dev-Days)</span>
            ${evmLozenge}
          </div>
          <div class="gov-stat-row">
            <span>Effort CPI: <strong>${cpiVal.toFixed(2)}</strong></span>
            <span>Schedule SPI: <strong>${spiVal.toFixed(2)}</strong></span>
            <span>EAC: <strong>${(evm?.eacTrendDays ?? 0).toFixed(1)}d</strong> (BAC ${(evm?.bacDays ?? 0).toFixed(1)}d)</span>
          </div>
          <div class="gov-squad-list">
            ${squadRows}
          </div>
        </div>

        <!-- Card 3: Resource Contention & Handoffs -->
        <div class="gov-card">
          <div class="gov-card-header">
            <span>3. Resource Contention &amp; Handoffs</span>
            <span class="jira-lozenge ${(gov?.overallocatedAssignees.length ?? 0) > 0 ? 'jira-lozenge-inprogress' : 'jira-lozenge-done'}">
              ${gov?.overallocatedAssignees.length ?? 0} OVERLOADED
            </span>
          </div>
          <div class="gov-stat-row">
            <span>Blocked Handoff Idle: <strong>${(gov?.blockedHandoffIdleDays ?? 0).toFixed(1)}d</strong></span>
            <span>SLA Breach Risk: <strong>${Math.round((gov?.slaBreachProbability ?? 0) * 100)}%</strong></span>
          </div>
          ${
            (gov?.overallocatedAssignees.length ?? 0) > 0
              ? `<div class="gov-sub-note">Parallel Contention: ${escapeHtmlText(gov!.overallocatedAssignees.map((a) => `${a.assignee} (${a.utilizationPct}%)`).join(', '))}</div>`
              : `<div class="gov-sub-note">No parallel critical-path assignee multi-tasking detected.</div>`
          }
        </div>

        <!-- Card 4: Sprint Readiness (DoR) & Retro Calibration -->
        <div class="gov-card">
          <div class="gov-card-header">
            <span>4. Sprint Readiness &amp; Stage Gates</span>
            <span class="jira-lozenge ${(gov?.sprintReadinessScore ?? 100) >= 80 ? 'jira-lozenge-done' : 'jira-lozenge-inprogress'}">
              DoR ${gov?.sprintReadinessScore ?? 100}%
            </span>
          </div>
          <div class="gov-stat-row">
            <span>Stage Gates: <strong>${stageGateNodes.length}</strong> (${escapeHtmlText(stageGateNodes.join(', ') || 'None')})</span>
            <span>Retro Priors: <strong>${retroCal ? `${retroCal.empiricalVelocityRatio}x (${retroCal.completedCount} done)` : '1.0x'}</strong></span>
          </div>
        </div>
      </div>
    `;
  }

  const selectedNode =
    graph.nodes.find((n) => n.key === selectedNodeKey) ?? graph.nodes[0];
  if (!selectedNode) {
    return `
      <div class="empty-tab-notice">
        No issues found in <strong>${escapeHtmlText(graph.projectName)}</strong>. Use <strong>+ Add Sample Issues</strong> in the header or create Jira issues to view AI recommendations.
      </div>
    `;
  }
  const selectedStat = activeSim.nodeStats[selectedNode.key];
  const matchedBottleneck = activeSim.topBottlenecks.find(
    (b) => b.key === selectedNode.key
  );
  const downstreamCount =
    matchedBottleneck?.downstreamCount ??
    graph.edges.filter((e) => e.from === selectedNode.key).length;
  const critPct = Math.round((selectedStat?.criticalityIndex ?? 0) * 100);

  const primaryActionRec =
    selectedNode.baseEstimateDays <= 2
      ? `Task is small (${selectedNode.baseEstimateDays}d) — adding another developer would add handoff overhead. Best move: split or mock the dependency so downstream issues can start early.`
      : critPct >= 60
        ? `High-priority critical path issue (${critPct}% risk) blocking ${downstreamCount} downstream ${downstreamCount === 1 ? 'issue' : 'issues'}. Assign an extra developer to pair on ${selectedNode.key} and share early interface contracts.`
        : `Has ${Math.max(0, selectedStat?.slackDays ?? 0).toFixed(1)}d of schedule slack. Keep current owner (${selectedNode.assignee}) focused and avoid context-switching.`;

  return `
    <div class="gov-card-stack">
      <!-- Card 1: Concrete Recovery Action Plan for Selected Issue -->
      <div class="gov-card">
        <div class="gov-card-header">
          <span>1. Recommended Action Plan (${escapeHtmlText(selectedNode.key)})</span>
          <span class="jira-lozenge ${critPct >= 60 ? 'jira-lozenge-inprogress' : 'jira-lozenge-done'}">
            ${critPct >= 60 ? 'CRITICAL PATH' : 'ON TRACK'}
          </span>
        </div>
        <div class="gov-sub-note">
          💡 <strong>Triage Advice:</strong> ${escapeHtmlText(primaryActionRec)}
        </div>
        <div class="gov-stat-row">
          <span title="Estimated hours of downstream code/interface rework if this issue changes late">Rework Risk: <strong class="text-warning">~${activeSim.estimatedReworkHours} hrs</strong></span>
          <span title="Worst-case finish date across the 5% most delayed scenarios">Worst-Case Date: <strong class="text-danger">${formatFriendlyDate(activeSim.cvar95Date, true)}</strong></span>
        </div>
      </div>

      <!-- Card 2: Why Rovo & MCP Matter to Your Team -->
      <div class="gov-card">
        <div class="gov-card-header">
          <span>2. Connected AI Agents (Rovo &amp; IDE MCP)</span>
          <span class="jira-lozenge jira-lozenge-goal">${MCP_TOOLS_MANIFEST.length} LIVE TOOLS</span>
        </div>
        <div class="gov-sub-note">
          Allows <strong>Atlassian Rovo Chat</strong> and IDE coding agents (<strong>Cursor, Claude, VS Code</strong>) to query live Jira blockers and test schedule changes automatically:
        </div>
        <div class="gov-squad-list">
          <div class="gov-squad-row" title="MCP Tool: pwm_simulate_intervention | Rovo Action: simulate-delay-impact">
            <span><strong>Simulate Delay Impact</strong></span>
            <span class="text-brand">Tests +days, extra dev, or split links</span>
          </div>
          <div class="gov-squad-row" title="MCP Tool: pwm_get_critical_path | Rovo Action: analyze-critical-path">
            <span><strong>Find Top Blockers</strong></span>
            <span class="text-brand">Ranks #1–#3 sprint bottlenecks</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderGoalsCard(activeSim: SimulationResult): string {
  return `
    <div class="panel-card goals-panel-card">
      <div class="panel-header">
        <div class="panel-title">
          <span>Teamwork Graph Goals</span>
          ${renderInfoTooltip(
            'Teamwork Graph Goal Alignment',
            'Tracks how issue schedule changes ripple up to linked Teamwork Graph Goals.'
          )}
        </div>
        <span class="jira-lozenge jira-lozenge-goal">${activeSim.goalImpacts.length} GOALS</span>
      </div>
      <div class="goals-list-horizontal">
        ${activeSim.goalImpacts
          .map((goal) => {
            const statusClass =
              goal.status === 'Off Track'
                ? 'off-track'
                : goal.status === 'At Risk'
                  ? 'at-risk'
                  : '';
            const probPct = Math.round(goal.probabilityOfOnTime * 100);
            const barColor =
              goal.status === 'Off Track'
                ? '#CA3521'
                : goal.status === 'At Risk'
                  ? '#D97706'
                  : '#1F845A';
            const shiftSign =
              goal.rippleDelayDays > 0
                ? `+${goal.rippleDelayDays}d`
                : goal.rippleDelayDays < 0
                  ? `${goal.rippleDelayDays}d`
                  : '';
            const shiftClass = goal.rippleDelayDays > 0 ? 'text-danger' : 'text-success';

            return `
              <div class="goal-card ${statusClass}" title="Goal Key: ${escapeHtmlText(goal.goalKey)} | Owner: ${escapeHtmlText(goal.ownerTeam)}">
                <div class="goal-top">
                  <div>
                    <div class="goal-name">${escapeHtmlText(goal.goalName)}</div>
                    <div class="goal-owner-sub">
                      Owner: ${escapeHtmlText(goal.ownerTeam)}
                    </div>
                  </div>
                  ${renderJiraStatusLozenge(goal.status)}
                </div>
                <div class="goal-dates-row">
                  <span>Target: <strong>${formatFriendlyDate(goal.targetDate)}</strong></span>
                  <span>Projected: <strong>${formatFriendlyDate(goal.p85CompletionDate)}</strong> ${shiftSign ? `<em class="${shiftClass}">(${shiftSign})</em>` : ''}</span>
                  <span>On-Time: <strong>${probPct}%</strong></span>
                </div>
                <svg width="100%" height="6" class="prob-bar-svg">
                  <rect x="0" y="0" width="100%" height="6" rx="3" fill="#DCDFE4" />
                  <rect x="0" y="0" width="${Math.max(4, probPct)}%" height="6" rx="3" fill="${barColor}" />
                </svg>
              </div>
            `;
          })
          .join('')}
      </div>
    </div>
  `;
}

export function renderScenarioPanel(props: ScenarioPanelProps): string {
  const {
    graph,
    baselineSim,
    activeSim,
    selectedNodeKey,
    delayDays,
    addDeveloper,
    decoupleBlockingEdges,
    trimScope,
    simulatorMode,
    pinnedNodeOverrides,
    selectedAssignee,
    assigneeOverrides,
    activeRightTab,
    copiedPromptNotice,
  } = props;

  const selectedNode =
    graph.nodes.find((n) => n.key === selectedNodeKey) ?? graph.nodes[0];
  if (!selectedNode) {
    return `
      <div class="right-column" data-drop-zone="scenario">
        <div class="panel-card">
          <div class="panel-header">
            <div class="panel-title">
              ${renderDragHandleBadge('scenario', 'What-If Scenario Simulator')}
              <span>What-If Scenario Simulator</span>
            </div>
            <span class="jira-lozenge jira-lozenge-todo">NO ISSUES</span>
          </div>
          <div class="intervention-box">
            <div class="empty-tab-notice">
              Project <strong>${escapeHtmlText(graph.projectName)}</strong> has 0 issues yet. Click <strong>+ Add Sample Issues</strong> in the top bar to populate linked Jira tasks and start running What-If simulations.
            </div>
          </div>
        </div>
      </div>
    `;
  }
  const selectedStat = activeSim.nodeStats[selectedNode.key];
  const blockedByKeys = graph.edges
    .filter((e) => e.to === selectedNode.key)
    .map((e) => e.from);
  const blocksKeys = graph.edges
    .filter((e) => e.from === selectedNode.key)
    .map((e) => e.to);

  const maxTimelineScale = Math.max(
    45,
    baselineSim.p95Days + 8,
    activeSim.p95Days + 8
  );
  const pct = (days: number) =>
    Math.min(100, Math.max(8, Math.round((days / maxTimelineScale) * 100)));

  const delaySignLabel =
    delayDays > 0
      ? `+${delayDays} Days Delay`
      : delayDays < 0
        ? `${delayDays} Days Faster`
        : '0 Days (Baseline)';

  // Compute Pinned Scenario Stack (all pinned issues + current modified issue if not yet in pinnedNodeOverrides, + person overrides)
  const pinnedEntries = Object.entries(pinnedNodeOverrides);
  const isCurrentPinned = Boolean(pinnedNodeOverrides[selectedNode.key]);
  const pinRank = isCurrentPinned
    ? pinnedEntries.findIndex(([k]) => k === selectedNode.key) + 1
    : 0;
  const activePersonEntries = Object.entries(assigneeOverrides).filter(([, aOv]) => {
    const u = Number(aOv.unavailableDays ?? 0);
    return (
      u !== 0 ||
      Boolean(aOv.reassignBottleneck) ||
      Boolean(aOv.serializeParallelWork) ||
      Boolean(aOv.pairOnTopBlocker)
    );
  });

  const hasCurrentNodeMod =
    delayDays !== 0 || addDeveloper || decoupleBlockingEdges || trimScope;
  const totalStackedCount =
    pinnedEntries.length +
    (!isCurrentPinned && hasCurrentNodeMod ? 1 : 0) +
    activePersonEntries.length;

  const netP85Shift = Number((activeSim.p85Days - baselineSim.p85Days).toFixed(1));
  const activeLozenge =
    totalStackedCount > 1
      ? `<span class="jira-lozenge jira-lozenge-goal">${totalStackedCount} STACKED</span>`
      : activePersonEntries.length === 1 && !hasCurrentNodeMod
        ? `<span class="jira-lozenge jira-lozenge-inprogress">PERSON SCENARIO</span>`
        : delayDays > 0
          ? `<span class="jira-lozenge jira-lozenge-danger">+${delayDays}D DELAY</span>`
          : delayDays < 0
            ? `<span class="jira-lozenge jira-lozenge-done">${delayDays}D FASTER</span>`
            : addDeveloper || decoupleBlockingEdges || trimScope
              ? `<span class="jira-lozenge jira-lozenge-done">MITIGATED</span>`
              : `<span class="jira-lozenge jira-lozenge-todo">BASELINE</span>`;

  const uncertaintyLabel =
    selectedNode.uncertaintySigma >= 1.8
      ? 'High'
      : selectedNode.uncertaintySigma >= 1.0
        ? 'Medium'
        : 'Low';

  const getInitials = (name: string) =>
    name
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2) || 'DEV';

  const assigneeInitials = getInitials(selectedNode.assignee);
  const doneSub = selectedNode.subtaskDoneCount ?? 0;
  const totalSub = selectedNode.subtaskTotalCount ?? 4;
  const progPct =
    selectedNode.subtaskProgressPct ??
    selectedStat?.completionStepPct ??
    (selectedNode.status === 'Done' ? 100 : selectedNode.status === 'In Progress' ? 50 : 0);

  const isTopBlocker =
    activeSim.topBottlenecks.slice(0, 3).some((b) => b.key === selectedNode.key) ||
    selectedNode.status.toLowerCase() === 'blocked' ||
    delayDays > 0;
  const isStageGate =
    Boolean(selectedNode.isStageGate) ||
    Boolean(selectedNode.confluenceDecision);

  const shapeTaxonomyBadge = isStageGate
    ? `<span class="shape-badge-diamond">◆ STAGE GATE</span>`
    : isTopBlocker
      ? `<span class="shape-badge-hex">⬢ BLOCKER</span>`
      : `<span class="shape-badge-circle">● TASK / EPIC</span>`;

  const progBarColor =
    progPct >= 100
      ? '#10B981'
      : isTopBlocker
        ? '#F59E0B'
        : '#0C66E4';

  const baseP50X = Math.max(24, Math.min(240, Math.round((baselineSim.p50Days / maxTimelineScale) * 260)));
  const simP85X = Math.max(36, Math.min(265, Math.round((activeSim.p85Days / maxTimelineScale) * 260)));
  const bellStroke = netP85Shift > 0 ? '#E11D48' : netP85Shift < 0 ? '#10B981' : '#4F46E5';
  const bellFill = netP85Shift > 0 ? '#FFE4E6' : netP85Shift < 0 ? '#D1FAE5' : '#E0E7FF';

  // Aggregate Assignee Roster from real Jira issues for "By Person & Team" mode
  const assigneeStatsMap = new Map<
    string,
    {
      name: string;
      totalCount: number;
      activeCount: number;
      totalEstimateDays: number;
      criticalCount: number;
      issueKeys: string[];
    }
  >();
  for (const node of graph.nodes) {
    const aName = node.assignee || 'Unassigned';
    const entry = assigneeStatsMap.get(aName) ?? {
      name: aName,
      totalCount: 0,
      activeCount: 0,
      totalEstimateDays: 0,
      criticalCount: 0,
      issueKeys: [],
    };
    entry.totalCount += 1;
    if (node.status.toLowerCase() !== 'done') {
      entry.activeCount += 1;
      entry.totalEstimateDays += node.baseEstimateDays;
    }
    if ((activeSim.nodeStats[node.key]?.criticalityIndex ?? 0) >= 0.45) {
      entry.criticalCount += 1;
    }
    entry.issueKeys.push(node.key);
    assigneeStatsMap.set(aName, entry);
  }
  const assigneeList = Array.from(assigneeStatsMap.values()).sort((a, b) => {
    if (a.name.toLowerCase() === 'unassigned') return 1;
    if (b.name.toLowerCase() === 'unassigned') return -1;
    return b.activeCount - a.activeCount || b.totalEstimateDays - a.totalEstimateDays;
  });
  const activeAssigneeStats =
    assigneeList.find((a) => a.name === selectedAssignee) ?? assigneeList[0];
  const currentPersonName = activeAssigneeStats?.name ?? 'Unassigned';
  const currentPersonOv: AssigneeInterventionOverride = assigneeOverrides[currentPersonName] ?? {
    assignee: currentPersonName,
    unavailableDays: 0,
    reassignBottleneck: false,
    serializeParallelWork: false,
    pairOnTopBlocker: false,
  };
  const ptoDays = Number(currentPersonOv.unavailableDays ?? 0);
  const ptoSignLabel =
    ptoDays > 0
      ? `+${ptoDays} Days Away`
      : ptoDays < 0
        ? `${ptoDays} Days Focus Gain`
        : '0 Days (Normal Capacity)';

  const personLoadPct = activeAssigneeStats
    ? currentPersonOv.reassignBottleneck && currentPersonOv.serializeParallelWork
      ? Math.max(65, Math.round(activeAssigneeStats.activeCount * 38))
      : currentPersonOv.reassignBottleneck
        ? Math.max(70, Math.round((activeAssigneeStats.activeCount - 1) * 55))
        : Math.min(250, Math.max(40, activeAssigneeStats.activeCount * 65))
    : 100;

  // Build Pinned Scenario Stack chip tray HTML
  const circledNums = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
  const issueChipsHtml = pinnedEntries
    .map(([key, ov], idx) => {
      const badgeNum = circledNums[idx] ?? `#${idx + 1}`;
      const activeCls =
        simulatorMode === 'issue' && key === selectedNodeKey ? 'active' : '';
      return `
        <div class="scenario-chip ${activeCls}" data-focus-pin="${escapeHtmlText(key)}" title="Click to edit pinned scenario for ${escapeHtmlText(key)}">
          <span class="scenario-chip-label">${badgeNum} ${escapeHtmlText(key)}: ${escapeHtmlText(summarizeNodeOverride(ov))}</span>
          <button type="button" class="scenario-chip-remove" data-unpin-node="${escapeHtmlText(key)}" title="Remove ${escapeHtmlText(key)} from scenario stack">×</button>
        </div>
      `;
    })
    .join('');

  const personChipsHtml = activePersonEntries
    .map(([name, aOv]) => {
      const shortName =
        name.length > 14 ? `${name.split(/\s+/)[0]} ${name.split(/\s+/)[1]?.[0] ?? ''}.`.trim() : name;
      const activeCls =
        simulatorMode === 'person' && name === currentPersonName ? 'active' : '';
      return `
        <div class="scenario-chip person-chip ${activeCls}" data-focus-person="${escapeHtmlText(name)}" title="Click to edit person capacity scenario for ${escapeHtmlText(name)}">
          <span class="scenario-chip-label">👤 ${escapeHtmlText(shortName)}: ${escapeHtmlText(summarizeAssigneeOverride(aOv))}</span>
          <button type="button" class="scenario-chip-remove" data-clear-person="${escapeHtmlText(name)}" title="Remove ${escapeHtmlText(name)} from scenario stack">×</button>
        </div>
      `;
    })
    .join('');

  const stackBarHtml = `
    <div class="scenario-stack-bar">
      <div class="scenario-stack-header">
        <span>Active Scenario Stack (${pinnedEntries.length + activePersonEntries.length})</span>
        <div class="scenario-stack-actions">
          ${
            simulatorMode === 'issue'
              ? `<button
                   type="button"
                   class="btn-pin-issue ${isCurrentPinned ? 'is-pinned' : ''}"
                   id="btn-pin-current-issue"
                   title="${isCurrentPinned ? 'Unpin this issue from the multi-issue scenario stack' : 'Lock this issue into Active Scenario Stack so you can tweak other issues simultaneously'}"
                 >
                   ${isCurrentPinned ? `✓ Pinned (${circledNums[pinRank - 1] ?? `#${pinRank}`})` : `📌 Pin ${escapeHtmlText(selectedNode.key)}`}
                 </button>`
              : ''
          }
          ${
            pinnedEntries.length + activePersonEntries.length > 0
              ? `<button type="button" class="scenario-clear-btn" id="btn-clear-scenario-stack" title="Clear all pinned issue and person scenarios">Clear All</button>`
              : ''
          }
        </div>
      </div>
      ${
        pinnedEntries.length + activePersonEntries.length > 0
          ? `<div class="scenario-chip-list">${issueChipsHtml}${personChipsHtml}</div>`
          : ''
      }
    </div>
  `;

  const forecastRows = [
    {
      label: 'Likely Finish (50% odds)',
      tooltip: 'Likely Delivery Date: 50% of simulated runs finish on or before this date (normal sprint pace without unexpected blockers).',
      baseDays: baselineSim.p50Days,
      intDays: activeSim.p50Days,
      baseDate: baselineSim.p50Date,
      intDate: activeSim.p50Date,
    },
    {
      label: 'Target Commit Date (85% safe)',
      tooltip: 'Recommended Target Commit Date: 85% probability of finishing on or before this date (includes Team Risk Buffer).',
      baseDays: baselineSim.p85Days,
      intDays: activeSim.p85Days,
      baseDate: baselineSim.p85Date,
      intDate: activeSim.p85Date,
    },
    {
      label: 'Safe Buffer Date (95% cutoff)',
      tooltip: `Safe Buffer Cutoff Date (95% confidence). Worst-case 5% blocker scenario finishes around ${formatFriendlyDate(activeSim.cvar95Date, true)}.`,
      baseDays: baselineSim.p95Days,
      intDays: activeSim.p95Days,
      baseDate: baselineSim.p95Date,
      intDate: activeSim.p95Date,
    },
  ];

  const issueModeContentHtml = `
    <!-- Selected Issue Card -->
    <div class="selected-node-banner">
      <div class="node-banner-top">
        <div class="node-banner-id-cluster">
          <span class="node-avatar-circle" title="Responsible Assignee: ${escapeHtmlText(selectedNode.assignee)}">${escapeHtmlText(assigneeInitials)}</span>
          <span class="node-key-tag">${escapeHtmlText(selectedNode.key)}</span>
          ${shapeTaxonomyBadge}
        </div>
        ${renderJiraStatusLozenge(selectedNode.status)}
      </div>
      <div class="node-summary-text">${escapeHtmlText(selectedNode.summary)}</div>
      <div class="node-subtask-bar-wrap" title="Overall Issue / Epic Sub-task Completion: ${doneSub}/${totalSub} Sub-tasks (${progPct}%)">
        <div class="node-subtask-bar-labels">
          <span>Sub-tasks / Epic Progress</span>
          <strong>${doneSub}/${totalSub} Done (${progPct}%)</strong>
        </div>
        <svg width="100%" height="6" class="subtask-bar-svg">
          <rect x="0" y="0" width="100%" height="6" rx="3" fill="#E2E8F0" />
          <rect x="0" y="0" width="${Math.max(4, progPct)}%" height="6" rx="3" fill="${progBarColor}" />
        </svg>
      </div>
      <div class="node-meta-grid">
        <div class="meta-cell">
          <span>Assignee</span>
          <strong>${escapeHtmlText(selectedNode.assignee)}</strong>
        </div>
        <div class="meta-cell">
          <span>Estimate</span>
          <strong>${selectedNode.baseEstimateDays} Days</strong>
        </div>
        <div class="meta-cell" title="Estimate Uncertainty: ±${selectedNode.uncertaintySigma} days of potential schedule variance">
          <span>Uncertainty ⓘ</span>
          <strong>${uncertaintyLabel}</strong>
        </div>
        <div class="meta-cell" title="Criticality Index: ${Math.round((selectedStat?.criticalityIndex ?? 0) * 100)}% of Monte Carlo runs place this issue on the critical path">
          <span>Criticality ⓘ</span>
          <strong>${Math.round((selectedStat?.criticalityIndex ?? 0) * 100)}%</strong>
        </div>
      </div>
      <div class="node-lineage-row">
        <div class="lineage-cell" title="${escapeHtmlText(blockedByKeys.length > 0 ? `Upstream blockers: ${blockedByKeys.join(', ')}` : 'Entry task with no upstream blockers')}">
          <span>Blocked by:</span>
          <strong>${escapeHtmlText(blockedByKeys.length > 0 ? blockedByKeys.join(', ') : 'None (Entry Task)')}</strong>
        </div>
        <div class="lineage-cell" title="${escapeHtmlText(blocksKeys.length > 0 ? `Downstream dependents: ${blocksKeys.join(', ')}` : 'Terminal task with no downstream dependents')}">
          <span>Blocks:</span>
          <strong>${escapeHtmlText(blocksKeys.length > 0 ? blocksKeys.join(', ') : 'None (Terminal Task)')}</strong>
        </div>
      </div>
    </div>

    <!-- Step 1: Schedule Change Slider & Mitigations -->
    <div class="delay-slider-card">
      <div class="slider-header">
        <span class="slider-title">1. Schedule Change (-5d to +30d)</span>
        <span class="slider-readout ${delayDays < 0 ? 'accel-text' : delayDays === 0 ? 'neutral-text' : ''}">
          ${delaySignLabel}
        </span>
      </div>
      <input
        type="range"
        min="-5"
        max="30"
        step="1"
        value="${delayDays}"
        class="delay-range-input"
        id="delay-slider-input"
      />
      <div class="preset-row">
        ${[-5, -3, 0, 5, 10, 18, 30]
          .map(
            (val) => `
            <button class="preset-btn ${delayDays === val ? 'active' : ''}" data-preset-delay="${val}">
              ${val === 0 ? '0d' : val > 0 ? `+${val}d` : `${val}d`}
            </button>
          `
          )
          .join('')}
      </div>

      <div class="mitigation-label">2. Recovery Mitigations</div>
      <div class="scope-toggles-row">
        <button
          class="scope-toggle-btn ${addDeveloper ? 'active' : ''}"
          id="btn-toggle-add-dev"
          title="Assign 1 extra full-time developer to help finish this issue faster (automatically accounts for ramp-up and coordination time)"
        >
          ${addDeveloper ? '✓ Extra Dev Added' : '+ Assign Extra Developer'}
        </button>
        <button
          class="scope-toggle-btn ${decoupleBlockingEdges ? 'active' : ''}"
          id="btn-toggle-decouple-edge"
          title="Split or mock the blocking interface so downstream issues can start work in parallel without waiting for this issue to finish 100%"
        >
          ${decoupleBlockingEdges ? '✓ Split / Mocked' : '✂ Decouple Dependency'}
        </button>
        <button
          class="scope-toggle-btn ${trimScope ? 'active' : ''}"
          id="btn-toggle-trim-scope"
          title="Defer non-essential sub-tasks or stretch goals to the next sprint (-35% remaining work & -45% uncertainty) to protect the release date"
        >
          ${trimScope ? '✓ Scope Trimmed (MVP)' : '📦 Trim Scope (MVP)'}
        </button>
      </div>
      ${
        addDeveloper && activeSim.deliveryGovernance?.brooksLawDiagnostic
          ? `<div class="brooks-advisory-banner" title="Accounts for realistic developer onboarding and team sync time">
               <span><strong>Team Ramp-Up Note:</strong> Net <strong>${
                 activeSim.deliveryGovernance.brooksLawDiagnostic.netAccelerationDays >= 0
                   ? `${activeSim.deliveryGovernance.brooksLawDiagnostic.netAccelerationDays}d saved`
                   : `${Math.abs(activeSim.deliveryGovernance.brooksLawDiagnostic.netAccelerationDays)}d slower`
               }</strong> after ${activeSim.deliveryGovernance.brooksLawDiagnostic.onboardingPenaltyDays}d of ramp-up &amp; handoff sync</span>
             </div>`
          : ''
      }
    </div>
  `;

  const personModeContentHtml = `
    <!-- Selected Person & Team Card -->
    <div class="selected-node-banner">
      <div class="node-banner-top">
        <div class="node-banner-id-cluster">
          <span class="node-avatar-circle">${escapeHtmlText(getInitials(currentPersonName))}</span>
          <span class="node-key-tag">${escapeHtmlText(currentPersonName)}</span>
        </div>
        <span class="jira-lozenge ${personLoadPct > 105 ? 'jira-lozenge-danger' : 'jira-lozenge-done'}">
          ${personLoadPct}% LOAD
        </span>
      </div>

      <div class="assignee-roster-grid">
        ${assigneeList
          .map((person) => {
            const pOv = assigneeOverrides[person.name];
            const hasOv =
              pOv &&
              ((pOv.unavailableDays ?? 0) !== 0 ||
                pOv.reassignBottleneck ||
                pOv.serializeParallelWork ||
                pOv.pairOnTopBlocker);
            return `
              <button
                type="button"
                class="assignee-pill-btn ${person.name === currentPersonName ? 'active' : ''} ${hasOv ? 'has-override' : ''}"
                data-select-assignee="${escapeHtmlText(person.name)}"
                title="${escapeHtmlText(person.name)}: ${person.activeCount} active / ${person.totalCount} total issues (${person.totalEstimateDays}d remaining)"
              >
                <span class="assignee-pill-initials">${escapeHtmlText(getInitials(person.name))}</span>
                <span class="assignee-pill-name">${escapeHtmlText(person.name)}</span>
                <span class="assignee-pill-count">${person.activeCount}/${person.totalCount}</span>
              </button>
            `;
          })
          .join('')}
      </div>

      <div class="node-meta-grid">
        <div class="meta-cell">
          <span>Active Tasks</span>
          <strong>${activeAssigneeStats?.activeCount ?? 0} Issues</strong>
        </div>
        <div class="meta-cell">
          <span>Remaining</span>
          <strong>${activeAssigneeStats?.totalEstimateDays ?? 0} Days</strong>
        </div>
        <div class="meta-cell">
          <span>Critical Path</span>
          <strong>${activeAssigneeStats?.criticalCount ?? 0} Issues</strong>
        </div>
        <div class="meta-cell">
          <span>Parallel WIP</span>
          <strong>${personLoadPct}%</strong>
        </div>
      </div>

      <div class="node-lineage-row">
        <div class="lineage-cell" title="Jira issues assigned to ${escapeHtmlText(currentPersonName)}">
          <span>Assigned Issues:</span>
          <strong>${escapeHtmlText(activeAssigneeStats?.issueKeys.join(', ') || 'None')}</strong>
        </div>
        <div class="lineage-cell">
          <span>Focus Status:</span>
          <strong>${
            (activeAssigneeStats?.activeCount ?? 0) >= 2 && !currentPersonOv.serializeParallelWork
              ? 'Parallel Overload'
              : 'Balanced Focus'
          }</strong>
        </div>
      </div>
    </div>

    <!-- Step 1 (Person): Unavailability Slider & Workload Mitigations -->
    <div class="delay-slider-card">
      <div class="slider-header">
        <span class="slider-title">1. Unavailability / Absence (-3d to +15d)</span>
        <span class="slider-readout ${ptoDays < 0 ? 'accel-text' : ptoDays === 0 ? 'neutral-text' : ''}">
          ${ptoSignLabel}
        </span>
      </div>
      <input
        type="range"
        min="-3"
        max="15"
        step="1"
        value="${ptoDays}"
        class="delay-range-input"
        id="person-pto-slider-input"
      />
      <div class="preset-row">
        ${[-3, 0, 2, 5, 10, 15]
          .map(
            (val) => `
            <button class="preset-btn ${ptoDays === val ? 'active' : ''}" data-preset-pto="${val}">
              ${val === 0 ? '0d' : val > 0 ? `+${val}d` : `${val}d`}
            </button>
          `
          )
          .join('')}
      </div>

      <div class="mitigation-label">2. Workload Mitigations</div>
      <div class="scope-toggles-row">
        <button
          class="scope-toggle-btn ${currentPersonOv.reassignBottleneck ? 'active' : ''}"
          id="btn-person-reassign"
          title="Offload this person's parallel bottleneck task to an available developer (-28% duration & removes concurrent contention)"
        >
          ${currentPersonOv.reassignBottleneck ? '✓ Bottleneck Reassigned' : '⇄ Reassign Bottleneck'}
        </button>
        <button
          class="scope-toggle-btn ${currentPersonOv.serializeParallelWork ? 'active' : ''}"
          id="btn-person-serialize"
          title="Eliminate multi-tasking context switches so active tasks run in clean sequence"
        >
          ${currentPersonOv.serializeParallelWork ? '✓ Parallel Serialized' : '🧹 Serialize Parallel Work'}
        </button>
        <button
          class="scope-toggle-btn ${currentPersonOv.pairOnTopBlocker ? 'active' : ''}"
          id="btn-person-pair"
          title="Pair +1 developer on this person's highest-impact critical blocker issue"
        >
          ${currentPersonOv.pairOnTopBlocker ? '✓ Paired Blocker' : '🤝 Pair on Top Blocker'}
        </button>
      </div>
    </div>
  `;

  return `
    <div class="right-column" data-drop-zone="scenario">
      <!-- What-If Simulator Controls Card -->
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-title">
            ${renderDragHandleBadge('scenario', 'What-If Scenario Simulator')}
            <span>What-If Scenario Simulator</span>
            ${renderInfoTooltip(
              'What-If Scenario Simulator',
              'Simulate schedule delays or recovery mitigations on single or multiple pinned Jira issues, or switch to By Person & Team to test absences and workload rebalancing.',
              `Active Interventions: ${totalStackedCount} | Selected: ${selectedNode.key}`
            )}
          </div>
          ${activeLozenge}
        </div>

        <div class="intervention-box">
          <!-- Dual-Mode Switcher (By Issue vs. By Person & Team) -->
          <div class="sim-mode-switcher" role="tablist" aria-label="Simulation target mode">
            <button
              type="button"
              class="sim-mode-btn ${simulatorMode === 'issue' ? 'active' : ''}"
              data-sim-mode="issue"
            >
              📋 By Issue
            </button>
            <button
              type="button"
              class="sim-mode-btn ${simulatorMode === 'person' ? 'active' : ''}"
              data-sim-mode="person"
            >
              👤 By Person &amp; Team
            </button>
          </div>

          ${stackBarHtml}

          ${simulatorMode === 'person' ? personModeContentHtml : issueModeContentHtml}

          <!-- Step 2: Release Date Comparison Bars -->
          <div class="comparison-bars-card">
            <div class="comparison-card-header">
              <span>Projected Release Impact</span>
              ${renderInfoTooltip(
                'Baseline vs. Simulated Forecast',
                `Compares your baseline schedule against the simulated What-If change across 500 paired runs. Worst-case 5% blocker scenario finishes around ${formatFriendlyDate(activeSim.cvar95Date, true)}.`,
                `Release Shift: ${(activeSim.p85Days - baselineSim.p85Days).toFixed(1)}d | Worst-Case Date: ${activeSim.cvar95Date}`
              )}
            </div>

            <div class="mc-bell-curve-wrap" title="500-Run Monte Carlo Release Probability Curve (Likely Finish / Target Commit Date / Safe Buffer Date)">
              <svg width="100%" height="52" viewBox="0 0 280 52" class="mc-bell-svg">
                <path d="M 8 48 C 60 48, ${Math.max(40, simP85X - 45)} 8, ${simP85X - 14} 8 C ${simP85X + 18} 8, 235 48, 272 48 Z" fill="${bellFill}" />
                <path d="M 8 48 C 60 48, ${Math.max(40, simP85X - 45)} 8, ${simP85X - 14} 8 C ${simP85X + 18} 8, 235 48, 272 48" fill="none" stroke="${bellStroke}" stroke-width="2" />
                <line x1="${baseP50X}" y1="8" x2="${baseP50X}" y2="48" stroke="#64748B" stroke-width="1.3" stroke-dasharray="3 2" />
                <line x1="${simP85X}" y1="5" x2="${simP85X}" y2="48" stroke="${bellStroke}" stroke-width="2" />
                <rect x="8" y="3" width="104" height="16" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2" />
                <text x="60" y="14" text-anchor="middle" fill="${bellStroke}" font-size="9.5" font-weight="700">Target: ${escapeHtmlText(formatFriendlyDate(activeSim.p85Date))}</text>
              </svg>
            </div>

            ${forecastRows
              .map((row) => {
                const diff = Number((row.intDays - row.baseDays).toFixed(1));
                const intBarColor =
                  diff > 0 ? '#CA3521' : diff < 0 ? '#1F845A' : '#0C66E4';
                const diffBadge =
                  diff > 0
                    ? `<span class="text-danger">(+${diff}d)</span>`
                    : diff < 0
                      ? `<span class="text-success">(${diff}d)</span>`
                      : `<span class="text-muted">(0d)</span>`;

                return `
                  <div class="dist-compare-group" title="${escapeHtmlText(row.tooltip)}">
                    <div class="dist-compare-label">
                      <strong>${escapeHtmlText(row.label)}</strong>
                      <span>
                        ${formatFriendlyDate(row.baseDate)} → <strong>${formatFriendlyDate(row.intDate)}</strong> ${diffBadge}
                      </span>
                    </div>
                    <svg width="100%" height="14" class="dual-bar-svg">
                      <rect x="0" y="0" width="100%" height="6" rx="3" fill="#DCDFE4" />
                      <rect x="0" y="0" width="${pct(row.baseDays)}%" height="6" rx="3" fill="#8590A2" />
                      <rect x="0" y="8" width="100%" height="6" rx="3" fill="#DCDFE4" />
                      <rect x="0" y="8" width="${pct(row.intDays)}%" height="6" rx="3" fill="${intBarColor}" />
                    </svg>
                  </div>
                `;
              })
              .join('')}

            <button class="btn btn-primary btn-rovo-copy" id="btn-copy-rovo-prompt" title="Copy prompt for @Rovo-World-Model Agent in Rovo Chat">
              ${copiedPromptNotice ? '✓ Copied Prompt for @Rovo-World-Model Agent!' : '✨ Ask @Rovo-World-Model Agent'}
            </button>
          </div>
        </div>
      </div>

      <!-- Inspector Tabs -->
      <div class="panel-card">
        <div class="tab-bar">
          <button class="tab-btn ${activeRightTab === 'cascade' ? 'active' : ''}" data-tab="cascade">
            Impacted (${activeSim.blastRadiusNodes.length})
          </button>
          <button class="tab-btn ${activeRightTab === 'bottlenecks' ? 'active' : ''}" data-tab="bottlenecks">
            Blockers (${activeSim.topBottlenecks.length})
          </button>
          <button class="tab-btn ${activeRightTab === 'governance' ? 'active' : ''}" data-tab="governance">
            Delivery Health
          </button>
          <button class="tab-btn ${activeRightTab === 'rovo-mcp' ? 'active' : ''}" data-tab="rovo-mcp">
            AI Action Plan
          </button>
        </div>
        <div class="tab-body">
          ${renderTabBody(props)}
        </div>
      </div>
    </div>
  `;
}
