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
  CausalGraph,
  InterventionResult,
  SimulationResult,
} from '../../../../src/engine/types';
import { MCP_TOOLS_MANIFEST } from '../../../../src/mcp/server';
import {
  escapeHtmlText,
  formatFriendlyDate,
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
  activeRightTab: 'cascade' | 'bottlenecks' | 'rovo-mcp';
  copiedPromptNotice: boolean;
}

export function buildRovoMitigationPrompt(props: ScenarioPanelProps): string {
  const { graph, selectedNodeKey, delayDays, addDeveloper, decoupleBlockingEdges, activeSim } =
    props;
  const node = graph.nodes.find((n) => n.key === selectedNodeKey) ?? graph.nodes[0];
  const goal = graph.goals.find((g) => g.id === node.goalId) ?? graph.goals[0];
  const shiftStr =
    delayDays >= 0
      ? `delayed by ${delayDays} days`
      : `accelerated by ${Math.abs(delayDays)} days`;
  const modifiers: string[] = [];
  if (addDeveloper) modifiers.push('adding +1 developer');
  if (decoupleBlockingEdges) modifiers.push('decoupling outgoing blocking dependencies');
  const modSuffix = modifiers.length > 0 ? ` while ${modifiers.join(' and ')}` : '';

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
  } = props;

  const hasActiveIntervention =
    delayDays !== 0 || addDeveloper || decoupleBlockingEdges;

  if (activeRightTab === 'cascade') {
    const deltas =
      intervention?.nodeDeltas.filter(
        (d) => d.key !== selectedNodeKey && Math.abs(d.shiftDays) > 0
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
          <tr data-select-node="${escapeHtmlText(d.key)}" style="cursor:pointer;" title="Click to inspect ${escapeHtmlText(d.key)} (${escapeHtmlText(d.summary)})">
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
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span>
              <strong style="color:#0C66E4;">#${idx + 1} ${escapeHtmlText(b.key)}</strong>
              — <strong style="font-size:12px;">${escapeHtmlText(b.summary)}</strong>
            </span>
            <span class="jira-lozenge jira-lozenge-inprogress">GATES ${b.downstreamCount}</span>
          </div>
          <div style="font-size:11.5px;color:var(--text-secondary);margin-top:4px;">
            Assignee: <strong>${escapeHtmlText(b.assignee)}</strong> · Risk Score: <strong>${b.riskScore}/100</strong>
          </div>
          <div style="font-size:11.5px;color:#0055CC;margin-top:4px;">
            💡 ${escapeHtmlText(b.recommendation)}
          </div>
        </div>
      `
      )
      .join('');
  }

  const mcpRpcSample = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'pwm_simulate_intervention',
      arguments: {
        projectKey: graph.projectKey,
        issueKey: selectedNodeKey,
        delayDays,
        addDeveloper,
        decoupleBlockingEdges,
      },
    },
    statisticalDiagnostics: {
      cvar95TailRiskDate: `${activeSim.cvar95Date} (+${activeSim.cvar95Days}d)`,
      quasimetricLatentEnergyE: activeSim.quasimetricEnergy,
      estimatedReworkHours: `${activeSim.estimatedReworkHours}h`,
      monteCarloIterations: 500,
      registeredMcpTools: MCP_TOOLS_MANIFEST.map((t) => t.name),
    },
  };

  return `
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div class="advanced-math-grid">
        <div class="math-stat-box" title="Conditional Value-at-Risk (CVaR 0.95): Expected finish date across the worst 5% tail-risk simulation runs">
          <span>Worst 5% Tail (CVaR₀.₉₅)</span>
          <strong style="color:#AE2E24;">${formatFriendlyDate(activeSim.cvar95Date, true)}</strong>
        </div>
        <div class="math-stat-box" title="Quasimetric Latent Energy E(s -> s'): Measures asymmetric schedule friction required to recover baseline dates">
          <span>Schedule Friction (E)</span>
          <strong style="color:#0055CC;">${activeSim.quasimetricEnergy}</strong>
        </div>
        <div class="math-stat-box" title="Expected downstream context-switching & interface rework hours">
          <span>Est. Rework Risk</span>
          <strong style="color:#A54800;">${activeSim.estimatedReworkHours} hrs</strong>
        </div>
      </div>
      <pre class="code-console">${escapeHtmlText(JSON.stringify(mcpRpcSample, null, 2))}</pre>
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
    activeRightTab,
    copiedPromptNotice,
  } = props;

  const selectedNode =
    graph.nodes.find((n) => n.key === selectedNodeKey) ?? graph.nodes[0];
  const selectedStat = activeSim.nodeStats[selectedNode.key];
  const linkedGoal =
    graph.goals.find((g) => g.id === selectedNode.goalId) ?? graph.goals[0];

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

  const activeLozenge =
    delayDays > 0
      ? `<span class="jira-lozenge jira-lozenge-danger">+${delayDays}D DELAY</span>`
      : delayDays < 0
        ? `<span class="jira-lozenge jira-lozenge-done">${delayDays}D FASTER</span>`
        : addDeveloper || decoupleBlockingEdges
          ? `<span class="jira-lozenge jira-lozenge-done">MITIGATED</span>`
          : `<span class="jira-lozenge jira-lozenge-todo">BASELINE</span>`;

  const uncertaintyLabel =
    selectedNode.uncertaintySigma >= 1.8
      ? 'High'
      : selectedNode.uncertaintySigma >= 1.0
        ? 'Medium'
        : 'Low';

  const forecastRows = [
    {
      label: 'Likely Finish (50%)',
      tooltip: 'Median P50 Forecast: 50% of simulated runs finish on or before this date.',
      baseDays: baselineSim.p50Days,
      intDays: activeSim.p50Days,
      baseDate: baselineSim.p50Date,
      intDate: activeSim.p50Date,
    },
    {
      label: 'Commit Target (85%)',
      tooltip: 'Recommended P85 Commitment Date: 85% probability of finishing on or before this date.',
      baseDays: baselineSim.p85Days,
      intDays: activeSim.p85Days,
      baseDate: baselineSim.p85Date,
      intDate: activeSim.p85Date,
    },
    {
      label: 'Buffer Cutoff (95%)',
      tooltip: `Conservative P95 Buffer Date. Extreme 5% tail risk (CVaR₀.₉₅) = ${activeSim.cvar95Date}.`,
      baseDays: baselineSim.p95Days,
      intDays: activeSim.p95Days,
      baseDate: baselineSim.p95Date,
      intDate: activeSim.p95Date,
    },
  ];

  return `
    <div class="right-column">
      <!-- What-If Simulator Controls Card -->
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-title">
            <span>What-If Scenario Simulator</span>
            ${renderInfoTooltip(
              'What-If Scenario Simulator',
              'Select any issue from your Jira project and test how a delay, acceleration, or resource change affects the overall delivery date and Teamwork Graph goals.',
              `Active Intervention: do(${selectedNode.key} = ${delayDays >= 0 ? `+${delayDays}d` : `${delayDays}d`})`
            )}
          </div>
          ${activeLozenge}
        </div>

        <div class="intervention-box">
          <!-- Selected Issue Card -->
          <div class="selected-node-banner">
            <div class="node-banner-top">
              <span class="node-key-tag">${escapeHtmlText(selectedNode.key)}</span>
              ${renderJiraStatusLozenge(selectedNode.status)}
            </div>
            <div class="node-summary-text">${escapeHtmlText(selectedNode.summary)}</div>
            <div class="node-meta-grid">
              <div class="meta-cell">
                <span>Assignee</span>
                <strong>${escapeHtmlText(selectedNode.assignee)}</strong>
              </div>
              <div class="meta-cell">
                <span>Estimate</span>
                <strong>${selectedNode.baseEstimateDays} Days</strong>
              </div>
              <div class="meta-cell" title="Log-normal uncertainty standard deviation σ = ±${selectedNode.uncertaintySigma} days">
                <span>Uncertainty ⓘ</span>
                <strong>${uncertaintyLabel}</strong>
              </div>
              <div class="meta-cell" title="Criticality Index: ${Math.round((selectedStat?.criticalityIndex ?? 0) * 100)}% of Monte Carlo runs place this issue on the critical path">
                <span>Criticality ⓘ</span>
                <strong>${Math.round((selectedStat?.criticalityIndex ?? 0) * 100)}%</strong>
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
                title="Reduces task duration by 35% and variance σ by 40%"
              >
                ${addDeveloper ? '✓ +1 Developer Added' : '+ Add Developer (+1 FTE)'}
              </button>
              <button
                class="scope-toggle-btn ${decoupleBlockingEdges ? 'active' : ''}"
                id="btn-toggle-decouple-edge"
                title="Reduces outgoing blocking dependency propagation weight to 0.25"
              >
                ${decoupleBlockingEdges ? '✓ Dependency Decoupled' : '✂ Decouple Dependency'}
              </button>
            </div>
          </div>

          <!-- Step 2: Release Date Comparison Bars -->
          <div class="comparison-bars-card">
            <div style="font-size:12px;font-weight:700;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center;">
              <span>Projected Release Impact</span>
              ${renderInfoTooltip(
                'Baseline vs. Simulated Forecast',
                `Compares your baseline schedule against the simulated What-If change across 500 paired runs. Worst 5% Tail Date: ${formatFriendlyDate(activeSim.cvar95Date, true)}.`,
                `ΔP85 = ${(activeSim.p85Days - baselineSim.p85Days).toFixed(1)}d | CVaR₀.₉₅ = ${activeSim.cvar95Date}`
              )}
            </div>

            ${forecastRows
              .map((row) => {
                const diff = Number((row.intDays - row.baseDays).toFixed(1));
                const intBarColor =
                  diff > 0 ? '#CA3521' : diff < 0 ? '#1F845A' : '#0C66E4';
                const diffBadge =
                  diff > 0
                    ? `<span style="color:#AE2E24;font-weight:700;">(+${diff}d)</span>`
                    : diff < 0
                      ? `<span style="color:#216E4E;font-weight:700;">(${diff}d)</span>`
                      : `<span style="color:#626F86;">(0d)</span>`;

                return `
                  <div class="dist-compare-group" title="${escapeHtmlText(row.tooltip)}">
                    <div class="dist-compare-label">
                      <strong>${escapeHtmlText(row.label)}</strong>
                      <span>
                        ${formatFriendlyDate(row.baseDate)} → <strong>${formatFriendlyDate(row.intDate)}</strong> ${diffBadge}
                      </span>
                    </div>
                    <div class="dual-bar-stack">
                      <div class="bar-track-line">
                        <div class="bar-fill-base" style="width:${pct(row.baseDays)}%;"></div>
                      </div>
                      <div class="bar-track-line">
                        <div class="bar-fill-sim" style="width:${pct(row.intDays)}%;background:${intBarColor};"></div>
                      </div>
                    </div>
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

      <!-- Teamwork Graph Goals Card -->
      <div class="panel-card">
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
        <div class="goals-list">
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

              return `
                <div class="goal-card ${statusClass}" title="Goal Key: ${escapeHtmlText(goal.goalKey)} | Owner: ${escapeHtmlText(goal.ownerTeam)}">
                  <div class="goal-top">
                    <div>
                      <div class="goal-name">${escapeHtmlText(goal.goalName)}</div>
                      <div style="font-size:11px;color:var(--text-secondary);">
                        Owner: ${escapeHtmlText(goal.ownerTeam)}
                      </div>
                    </div>
                    ${renderJiraStatusLozenge(goal.status)}
                  </div>
                  <div class="goal-dates-row">
                    <span>Target: <strong>${formatFriendlyDate(goal.targetDate)}</strong></span>
                    <span>Projected: <strong>${formatFriendlyDate(goal.p85CompletionDate)}</strong> ${shiftSign ? `<em style="color:${goal.rippleDelayDays > 0 ? '#AE2E24' : '#216E4E'};">(${shiftSign})</em>` : ''}</span>
                    <span>On-Time: <strong>${probPct}%</strong></span>
                  </div>
                  <div class="prob-bar-track">
                    <div class="prob-bar-fill" style="width:${probPct}%;background:${barColor};"></div>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>

      <!-- Inspector Tabs -->
      <div class="panel-card">
        <div class="tab-bar">
          <button class="tab-btn ${activeRightTab === 'cascade' ? 'active' : ''}" data-tab="cascade">
            Impacted Issues (${activeSim.blastRadiusNodes.length})
          </button>
          <button class="tab-btn ${activeRightTab === 'bottlenecks' ? 'active' : ''}" data-tab="bottlenecks">
            Top Blockers (${activeSim.topBottlenecks.length})
          </button>
          <button class="tab-btn ${activeRightTab === 'rovo-mcp' ? 'active' : ''}" data-tab="rovo-mcp">
            Math &amp; MCP
          </button>
        </div>
        <div class="tab-body">
          ${renderTabBody(props)}
        </div>
      </div>
    </div>
  `;
}
