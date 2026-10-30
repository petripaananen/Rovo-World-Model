/**
 * Step 4 Component 4: What-If Scenario Simulator Panel (`static/ui/src/components/ScenarioPanel.tsx`)
 *
 * Redesigned around Progressive Disclosure & 3-Second Usability:
 * - Zero raw math or Greek letters in primary labels (`What-If Scenario Simulator` instead of `$do$-Calculus`).
 * - Step 1: Selected Task & What-If Sliders (`Delay / Accelerate` + `Add Developer` + `Break Dependency`).
 * - Step 2: Immediate Release Forecast Comparison (Likely Target, 85% Commit Target, Worst-Case Buffer)
 *   with hover tooltips for CVaR_0.95, Quasimetric Energy E, and 500 CRN Monte Carlo runs.
 * - Step 3: One-click Rovo Agent Action button (`Copy Rovo AI Action Prompt`).
 * - Step 4: Clean Inspector Tabs (`Impacted Tasks`, `Top Blockers`, `Goals & Math Spec`).
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

  return `@Rovo-World-Model Agent Simulate what happens to our "${goal?.name ?? 'Q4 Global Launch'}" goal if ${node.key} ("${node.summary}") on team ${node.team} is ${shiftStr}${modSuffix}. Current projected release date is ${activeSim.p85Date} with ${activeSim.blastRadiusNodes.length} impacted downstream tasks. Recommend the top dependency to decouple so we ship on time.`;
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
          Drag the <strong>Schedule Change Slider</strong> above or toggle <strong>Add Developer / Break Dependency</strong> to see which downstream tasks shift across teams.
        </div>
      `;
    }

    const rows = deltas
      .map((d) => {
        const signStr = d.shiftDays > 0 ? `+${d.shiftDays}d` : `${d.shiftDays}d`;
        const deltaClass = d.shiftDays > 0 ? 'delayed' : 'baseline';
        return `
          <tr data-select-node="${escapeHtmlText(d.key)}" style="cursor:pointer;" title="Click to select ${escapeHtmlText(d.key)} (${escapeHtmlText(d.summary)})">
            <td><strong style="font-family:var(--font-mono);color:#38bdf8;">${escapeHtmlText(d.key)}</strong></td>
            <td>${escapeHtmlText(d.summary.slice(0, 32))}${d.summary.length > 32 ? '…' : ''}</td>
            <td><span class="badge-pill">${escapeHtmlText(d.team)}</span></td>
            <td style="font-family:var(--font-mono);">${formatFriendlyDate(d.intervenedP85Date)}</td>
            <td><span class="kpi-delta ${deltaClass}">${signStr}</span></td>
          </tr>
        `;
      })
      .join('');

    return `
      <table class="cascade-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Summary</th>
            <th>Team</th>
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
        <div class="bottleneck-item" data-select-node="${escapeHtmlText(b.key)}" title="Click to test interventions on ${escapeHtmlText(b.key)} | Ripple Weight: ${b.downstreamRippleWeight} | Criticality: ${Math.round(b.criticalityIndex * 100)}%">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span>
              <strong style="font-family:var(--font-mono);color:#a5b4fc;">#${idx + 1} ${escapeHtmlText(b.key)}</strong>
              — <strong style="font-size:12px;">${escapeHtmlText(b.summary)}</strong>
            </span>
            <span class="badge-pill rose">Blocks ${b.downstreamCount} Tasks</span>
          </div>
          <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">
            Team: <strong>${escapeHtmlText(b.team)}</strong> · Risk Score: <strong>${b.riskScore}/100</strong>
          </div>
          <div style="font-size:11px;color:#67e8f9;margin-top:4px;">
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
    advancedMathMetrics: {
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
          <span>Worst 5% Tail Date (CVaR₀.₉₅)</span>
          <strong style="color:#fda4af;">${formatFriendlyDate(activeSim.cvar95Date, true)}</strong>
        </div>
        <div class="math-stat-box" title="Quasimetric Latent Energy E(s -> s'): Measures asymmetric schedule friction required to recover baseline dates">
          <span>Schedule Friction (Latent E)</span>
          <strong style="color:#67e8f9;">${activeSim.quasimetricEnergy}</strong>
        </div>
        <div class="math-stat-box" title="Expected downstream context-switching & interface rework hours caused by schedule shift">
          <span>Est. Rework Overhead</span>
          <strong style="color:#fcd34d;">${activeSim.estimatedReworkHours} hrs</strong>
        </div>
      </div>
      <div style="font-size:11px;color:var(--text-secondary);">
        <strong>Live MCP Endpoint &amp; Rovo Action Payload:</strong>
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
    65,
    baselineSim.p95Days + 10,
    activeSim.p95Days + 10
  );
  const pct = (days: number) =>
    Math.min(100, Math.max(6, Math.round((days / maxTimelineScale) * 100)));

  const delaySignLabel =
    delayDays > 0
      ? `+${delayDays} Days Delay`
      : delayDays < 0
        ? `${delayDays} Days Faster`
        : 'No Change (Baseline)';

  const activeBadgeText =
    delayDays > 0
      ? `Simulated: +${delayDays}d Delay`
      : delayDays < 0
        ? `Simulated: ${delayDays}d Faster`
        : addDeveloper || decoupleBlockingEdges
          ? 'Mitigation Active'
          : 'Baseline';

  const uncertaintyLabel =
    selectedNode.uncertaintySigma >= 1.8
      ? 'High Variance'
      : selectedNode.uncertaintySigma >= 1.0
        ? 'Moderate'
        : 'Low Variance';

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
      tooltip: 'Recommended P85 Commitment Date: 85% probability of shipping on or before this date.',
      baseDays: baselineSim.p85Days,
      intDays: activeSim.p85Days,
      baseDate: baselineSim.p85Date,
      intDate: activeSim.p85Date,
    },
    {
      label: 'Worst-Case (95%)',
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
            <span>🎛️ What-If Scenario Simulator</span>
            ${renderInfoTooltip(
              'Counterfactual Intervention Engine (do-Calculus)',
              'Test schedule slips, extra engineering capacity, or dependency decoupling on any selected task. All downstream tasks and Teamwork Graph goals recalculate immediately.',
              `Active Intervention: do(${selectedNode.key} = ${delayDays >= 0 ? `+${delayDays}d` : `${delayDays}d`}, addDev=${addDeveloper}, decouple=${decoupleBlockingEdges})`
            )}
          </div>
          <span class="badge-pill ${delayDays > 0 ? 'rose' : delayDays < 0 ? 'emerald' : 'cyan'}">
            ${escapeHtmlText(activeBadgeText)}
          </span>
        </div>

        <div class="intervention-box">
          <!-- Selected Task Summary Card -->
          <div class="selected-node-banner">
            <div class="node-banner-top">
              <span class="node-key-tag">${escapeHtmlText(selectedNode.key)} · ${escapeHtmlText(selectedNode.status)}</span>
              <span class="badge-pill">${escapeHtmlText(selectedNode.team)} · ${escapeHtmlText(selectedNode.assignee)}</span>
            </div>
            <div class="node-summary-text">${escapeHtmlText(selectedNode.summary)}</div>
            <div class="node-meta-grid">
              <div class="meta-cell">
                <span>Teamwork Goal</span>
                <strong>${escapeHtmlText(linkedGoal?.name ?? selectedNode.goalId)}</strong>
              </div>
              <div class="meta-cell">
                <span>Estimated Effort</span>
                <strong>${selectedNode.baseEstimateDays} Days</strong>
              </div>
              <div class="meta-cell" title="Log-normal uncertainty standard deviation σ = ±${selectedNode.uncertaintySigma} days">
                <span>Risk Spread ⓘ</span>
                <strong>${uncertaintyLabel}</strong>
              </div>
              <div class="meta-cell" title="Criticality Index: ${Math.round((selectedStat?.criticalityIndex ?? 0) * 100)}% of Monte Carlo simulations have this task on the critical path">
                <span>Path Impact ⓘ</span>
                <strong>${Math.round((selectedStat?.criticalityIndex ?? 0) * 100)}% Critical</strong>
              </div>
            </div>
            ${
              selectedNode.confluenceDecision
                ? `<div class="confluence-adr-pill" title="Linked Confluence Architecture Decision Record via Atlassian Teamwork Graph">
                     📄 Linked Decision: <strong>${escapeHtmlText(selectedNode.confluenceDecision.title)}</strong>
                   </div>`
                : ''
            }
          </div>

          <!-- Step 1: Schedule & Mitigation Controls -->
          <div class="delay-slider-card">
            <div class="slider-header">
              <span class="slider-title">1. Simulate Task Delay or Speedup</span>
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
                    ${val === 0 ? 'Reset (0d)' : val > 0 ? `+${val}d` : `${val}d`}
                  </button>
                `
                )
                .join('')}
            </div>

            <div class="mitigation-label">2. Test Recovery Mitigations</div>
            <div class="scope-toggles-row">
              <button
                class="scope-toggle-btn ${addDeveloper ? 'active' : ''}"
                id="btn-toggle-add-dev"
                title="Math: Compresses base task estimate by 35% and reduces uncertainty variance σ by 40%"
              >
                👩‍💻 ${addDeveloper ? '✓ Developer Added (-35% Time)' : 'Add +1 Developer'}
              </button>
              <button
                class="scope-toggle-btn ${decoupleBlockingEdges ? 'active' : ''}"
                id="btn-toggle-decouple-edge"
                title="Math: Inserts an interface mock contract, reducing outgoing dependency propagation weight to 0.25"
              >
                ✂️ ${decoupleBlockingEdges ? '✓ Dependency Decoupled' : 'Decouple Dependency'}
              </button>
            </div>
          </div>

          <!-- Step 3: Side-by-Side Release Date Comparison -->
          <div class="comparison-bars-card">
            <div style="font-size:12px;font-weight:700;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center;">
              <span>📊 Release Date Impact (Original vs. Simulated)</span>
              ${renderInfoTooltip(
                'Baseline vs. Counterfactual Forecast',
                `Compares your original baseline schedule against the simulated What-If scenario across 500 paired runs. Extreme 5% Tail Date (CVaR₀.₉₅): ${formatFriendlyDate(activeSim.cvar95Date, true)} | Friction E: ${activeSim.quasimetricEnergy} | Est. Rework: ${activeSim.estimatedReworkHours}h.`,
                `ΔP85 = ${(activeSim.p85Days - baselineSim.p85Days).toFixed(1)}d | CVaR₀.₉₅ = ${activeSim.cvar95Date}`
              )}
            </div>

            ${forecastRows
              .map((row) => {
                const diff = Number((row.intDays - row.baseDays).toFixed(1));
                const intBarColor =
                  diff > 0 ? '#f43f5e' : diff < 0 ? '#10b981' : '#38bdf8';
                const diffBadge =
                  diff > 0
                    ? `<span style="color:#fb7185;font-weight:700;">(+${diff}d)</span>`
                    : diff < 0
                      ? `<span style="color:#34d399;font-weight:700;">(${diff}d)</span>`
                      : `<span style="color:#94a3b8;">(No change)</span>`;

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

            <button class="btn btn-rovo-copy" id="btn-copy-rovo-prompt" title="Copy a ready-to-paste prompt for @Rovo-World-Model Agent in Jira Rovo Chat">
              ${copiedPromptNotice ? '✓ Copied Prompt for @Rovo-World-Model Agent!' : '🤖 Ask @Rovo-World-Model Agent for Mitigation Plan'}
            </button>
          </div>
        </div>
      </div>

      <!-- Atlassian Teamwork Graph (TWG) Goals Status Card -->
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-title">
            <span>🧭 Business Goals (Atlassian Teamwork Graph)</span>
            ${renderInfoTooltip(
              'Teamwork Graph Goal Alignment',
              'Shows how engineering task changes affect high-level company goals and their probability of finishing on or before the target deadline.'
            )}
          </div>
          <span class="badge-pill cyan">${activeSim.goalImpacts.length} Linked Goals</span>
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
              const pillVariant =
                goal.status === 'Off Track'
                  ? 'rose'
                  : goal.status === 'At Risk'
                    ? 'amber'
                    : 'emerald';
              const probPct = Math.round(goal.probabilityOfOnTime * 100);
              const barColor =
                goal.status === 'Off Track'
                  ? '#f43f5e'
                  : goal.status === 'At Risk'
                    ? '#f59e0b'
                    : '#10b981';
              const shiftSign =
                goal.rippleDelayDays > 0
                  ? `+${goal.rippleDelayDays}d slip`
                  : goal.rippleDelayDays < 0
                    ? `${goal.rippleDelayDays}d faster`
                    : '';

              return `
                <div class="goal-card ${statusClass}" title="Goal ID: ${escapeHtmlText(goal.goalKey)} | Owner Team: ${escapeHtmlText(goal.ownerTeam)}">
                  <div class="goal-top">
                    <div>
                      <div class="goal-name">${escapeHtmlText(goal.goalName)}</div>
                      <div style="font-size:11px;color:var(--text-secondary);">
                        Owner: ${escapeHtmlText(goal.ownerTeam)}
                      </div>
                    </div>
                    <span class="badge-pill ${pillVariant}">${escapeHtmlText(goal.status)}</span>
                  </div>
                  <div class="goal-dates-row">
                    <span>Target: <strong>${formatFriendlyDate(goal.targetDate)}</strong></span>
                    <span>Projected: <strong>${formatFriendlyDate(goal.p85CompletionDate)}</strong> ${shiftSign ? `<em style="color:${goal.rippleDelayDays > 0 ? '#fb7185' : '#34d399'};">(${shiftSign})</em>` : ''}</span>
                    <span>On-Time Chance: <strong>${probPct}%</strong></span>
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

      <!-- Downstream Impact / Bottlenecks / Math & MCP Inspector Tabs -->
      <div class="panel-card">
        <div class="tab-bar">
          <button class="tab-btn ${activeRightTab === 'cascade' ? 'active' : ''}" data-tab="cascade">
            🌊 Impacted Tasks (${activeSim.blastRadiusNodes.length})
          </button>
          <button class="tab-btn ${activeRightTab === 'bottlenecks' ? 'active' : ''}" data-tab="bottlenecks">
            🚧 Top Blockers (${activeSim.topBottlenecks.length})
          </button>
          <button class="tab-btn ${activeRightTab === 'rovo-mcp' ? 'active' : ''}" data-tab="rovo-mcp">
            ⚙️ Math &amp; MCP Spec
          </button>
        </div>
        <div class="tab-body">
          ${renderTabBody(props)}
        </div>
      </div>
    </div>
  `;
}
