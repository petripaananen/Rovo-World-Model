/**
 * Step 4 Component 4: Counterfactual Intervention Panel (`static/ui/src/components/ScenarioPanel.tsx`)
 *
 * - Displays details of the currently selected node (Key, Summary, Team, Linked Goal, Base Estimate, Uncertainty σ).
 * - "What-If" Intervention Controls ($do$-calculus):
 *   1. Delay / Accelerate Slider: `-5 days` to `+30 days` (triggers instant `runWhatIfSimulation` calculation).
 *   2. Scope / Resource Toggle: Simulate adding a developer (+1 Swarm Resource) or decoupling a blocking edge.
 * - Causal Impact Readout:
 *   1. Side-by-side comparison of Baseline vs. Counterfactual P50 / P85 / P95 completion distribution bars.
 *   2. Top downstream affected tickets + "Copy Rovo Mitigation Prompt" button.
 */

import {
  CausalGraph,
  InterventionResult,
  SimulationResult,
} from '../../../../src/engine/types';
import { MCP_TOOLS_MANIFEST } from '../../../../src/mcp/server';

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

function escapeHtmlScenario(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildRovoMitigationPrompt(props: ScenarioPanelProps): string {
  const { graph, selectedNodeKey, delayDays, addDeveloper, decoupleBlockingEdges, activeSim } =
    props;
  const node = graph.nodes.find((n) => n.key === selectedNodeKey) ?? graph.nodes[0];
  const goal = graph.goals.find((g) => g.id === node.goalId) ?? graph.goals[0];
  const shiftStr = delayDays >= 0 ? `delayed by ${delayDays} days` : `accelerated by ${Math.abs(delayDays)} days`;
  const modifiers: string[] = [];
  if (addDeveloper) modifiers.push('adding +1 swarm developer');
  if (decoupleBlockingEdges) modifiers.push('decoupling outgoing blocking edges');
  const modSuffix = modifiers.length > 0 ? ` while ${modifiers.join(' and ')}` : '';

  return `@Rovo-World-Model Agent Simulate what happens to our "${goal?.name ?? 'Q4 Global Launch'}" goal if ${node.key} ("${node.summary}") on team ${node.team} is ${shiftStr}${modSuffix}. Current simulated P85 date is ${activeSim.p85Date} with ${activeSim.blastRadiusNodes.length} downstream blast-radius issues. Recommend the top dependency to decouple to ship on time with 85% confidence.`;
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
        <div style="padding: 12px 6px; color: var(--text-secondary); font-size: 12px;">
          Adjust the <strong>Delay / Accelerate Slider (-5d to +30d)</strong> or toggle <strong>Add Developer / Decouple Edge</strong> above to inspect downstream ticket shifts across teams.
        </div>
      `;
    }

    const rows = deltas
      .map((d) => {
        const signStr = d.shiftDays > 0 ? `+${d.shiftDays}d` : `${d.shiftDays}d`;
        const deltaClass = d.shiftDays > 0 ? 'delayed' : 'baseline';
        return `
          <tr data-select-node="${escapeHtmlScenario(d.key)}" style="cursor:pointer;">
            <td><strong style="font-family:var(--font-mono);color:#38bdf8;">${escapeHtmlScenario(d.key)}</strong></td>
            <td>${escapeHtmlScenario(d.summary.slice(0, 30))}${d.summary.length > 30 ? '…' : ''}</td>
            <td><span class="badge-pill">${escapeHtmlScenario(d.team)}</span></td>
            <td style="font-family:var(--font-mono);">${escapeHtmlScenario(d.intervenedP85Date)}</td>
            <td><span class="kpi-delta ${deltaClass}">${signStr}</span></td>
          </tr>
        `;
      })
      .join('');

    return `
      <table class="cascade-table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Downstream Summary</th>
            <th>Team</th>
            <th>Sim P85</th>
            <th>Causal Δ</th>
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
        <div class="bottleneck-item" data-select-node="${escapeHtmlScenario(b.key)}">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span>
              <strong style="font-family:var(--font-mono);color:#a5b4fc;">#${idx + 1} ${escapeHtmlScenario(b.key)}</strong>
              — <strong style="font-size:12px;">${escapeHtmlScenario(b.summary)}</strong>
            </span>
            <span class="badge-pill rose">Ripple Wt: ${b.downstreamRippleWeight}</span>
          </div>
          <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;font-family:var(--font-mono);">
            Team: ${escapeHtmlScenario(b.team)} · Criticality: ${Math.round(b.criticalityIndex * 100)}% · Fanout: ${b.downstreamCount} · Risk: ${b.riskScore}/100
          </div>
          <div style="font-size:11px;color:#67e8f9;margin-top:4px;">
            💡 ${escapeHtmlScenario(b.recommendation)}
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
    resultPreview: {
      p50Date: activeSim.p50Date,
      p85Date: activeSim.p85Date,
      p95Date: activeSim.p95Date,
      rippleDelayDays: activeSim.rippleDelayDays,
      blastRadiusCount: activeSim.blastRadiusNodes.length,
      registeredMcpTools: MCP_TOOLS_MANIFEST.map((t) => t.name),
    },
  };

  return `
    <div style="display:flex;flex-direction:column;gap:8px;">
      <div style="font-size:11.5px;color:var(--text-secondary);">
        <strong>Rovo-World-Model Agent (<code>rovo-world-model-agent</code>)</strong> &amp; <strong>MCP Endpoint (<code>mcp-world-model-endpoint</code>)</strong> live JSON-RPC payload:
      </div>
      <pre class="code-console">${escapeHtmlScenario(JSON.stringify(mcpRpcSample, null, 2))}</pre>
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
      ? `+${delayDays} Days (Delay)`
      : delayDays < 0
        ? `${delayDays} Days (Accelerate)`
        : '0 Days (Baseline)';

  return `
    <div class="right-column">
      <!-- Counterfactual Intervention Controls Card -->
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-title">
            🎛️ Scenario Intervention Panel ($do$-Calculus)
          </div>
          <span class="badge-pill ${delayDays > 0 ? 'rose' : delayDays < 0 ? 'emerald' : 'cyan'}">
            do(${escapeHtmlScenario(selectedNode.key)} = ${delayDays >= 0 ? `+${delayDays}d` : `${delayDays}d`})
          </span>
        </div>

        <div class="intervention-box">
          <!-- Selected Node Details -->
          <div class="selected-node-banner">
            <div class="node-banner-top">
              <span class="node-key-tag">${escapeHtmlScenario(selectedNode.key)} · ${escapeHtmlScenario(selectedNode.status)}</span>
              <span class="badge-pill">${escapeHtmlScenario(selectedNode.team)}</span>
            </div>
            <div class="node-summary-text">${escapeHtmlScenario(selectedNode.summary)}</div>
            <div class="node-meta-grid">
              <div class="meta-cell">
                <span>Linked Goal</span>
                <strong>${escapeHtmlScenario(linkedGoal?.name ?? selectedNode.goalId)}</strong>
              </div>
              <div class="meta-cell">
                <span>Base Estimate</span>
                <strong>${selectedNode.baseEstimateDays} Days</strong>
              </div>
              <div class="meta-cell">
                <span>Uncertainty σ</span>
                <strong>±${selectedNode.uncertaintySigma} Days</strong>
              </div>
              <div class="meta-cell">
                <span>Criticality</span>
                <strong>${Math.round((selectedStat?.criticalityIndex ?? 0) * 100)}%</strong>
              </div>
            </div>
            ${
              selectedNode.confluenceDecision
                ? `<div style="margin-top:7px;padding-top:6px;border-top:1px dashed var(--border-subtle);font-size:10.5px;color:#a5b4fc;font-family:var(--font-mono);">
                     📄 TWG Confluence Decision: <strong>${escapeHtmlScenario(selectedNode.confluenceDecision.title)}</strong> (${escapeHtmlScenario(selectedNode.confluenceDecision.spaceKey)})
                   </div>`
                : ''
            }
          </div>

          <!-- Delay / Accelerate Slider (-5d to +30d) -->
          <div class="delay-slider-card">
            <div class="slider-header">
              <span class="slider-title">Delay / Accelerate Slider (-5d to +30d)</span>
              <span class="slider-readout ${delayDays < 0 ? 'accel-text' : ''}">${delaySignLabel}</span>
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

            <!-- Scope / Resource Toggles -->
            <div class="scope-toggles-row">
              <button
                class="scope-toggle-btn ${addDeveloper ? 'active' : ''}"
                id="btn-toggle-add-dev"
                title="Simulate swarming +1 developer (-35% base duration, -40% uncertainty σ)"
              >
                👩‍💻 ${addDeveloper ? '✓ Added Swarm Developer (-35% Est)' : 'Add Developer (+1 Resource)'}
              </button>
              <button
                class="scope-toggle-btn ${decoupleBlockingEdges ? 'active' : ''}"
                id="btn-toggle-decouple-edge"
                title="Simulate decoupling outgoing blocking edges (reduces propagation weight to 0.25)"
              >
                ✂️ ${decoupleBlockingEdges ? '✓ Blocking Edge Decoupled' : 'Decouple Blocking Edge'}
              </button>
            </div>
          </div>

          <!-- Side-by-Side Baseline vs Counterfactual P50 / P85 / P95 Distribution Bars -->
          <div class="comparison-bars-card">
            <div style="font-size:11.5px;font-weight:700;margin-bottom:8px;display:flex;justify-content:space-between;">
              <span>📊 Baseline vs. Counterfactual Distribution (P50 / P85 / P95)</span>
              <span style="font-family:var(--font-mono);font-size:10.5px;color:var(--text-secondary);">500 CRN Worlds</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:6px;margin-bottom:6px;font-size:10px;font-family:var(--font-mono);color:#94a3b8;background:rgba(30,41,59,0.55);padding:5px 8px;border-radius:6px;">
              <span>CVaR₀.₉₅: <strong style="color:#fda4af;">${escapeHtmlScenario(activeSim.cvar95Date)} (+${activeSim.cvar95Days}d)</strong></span>
              <span>Latent Energy E: <strong style="color:#67e8f9;">${activeSim.quasimetricEnergy}</strong></span>
              <span>Rework Risk: <strong style="color:#fcd34d;">${activeSim.estimatedReworkHours}h</strong></span>
            </div>

            ${(['P50', 'P85', 'P95'] as const)
              .map((metric) => {
                const baseDays =
                  metric === 'P50'
                    ? baselineSim.p50Days
                    : metric === 'P85'
                      ? baselineSim.p85Days
                      : baselineSim.p95Days;
                const intDays =
                  metric === 'P50'
                    ? activeSim.p50Days
                    : metric === 'P85'
                      ? activeSim.p85Days
                      : activeSim.p95Days;
                const baseDate =
                  metric === 'P50'
                    ? baselineSim.p50Date
                    : metric === 'P85'
                      ? baselineSim.p85Date
                      : baselineSim.p95Date;
                const intDate =
                  metric === 'P50'
                    ? activeSim.p50Date
                    : metric === 'P85'
                      ? activeSim.p85Date
                      : activeSim.p95Date;
                const diff = Number((intDays - baseDays).toFixed(1));
                const intBarColor =
                  diff > 0 ? '#f43f5e' : diff < 0 ? '#10b981' : '#38bdf8';

                return `
                  <div class="dist-compare-group">
                    <div class="dist-compare-label">
                      <strong>${metric}</strong>
                      <span>Base: ${baseDate} (${baseDays}d) vs. Sim: <strong>${intDate} (${intDays}d)</strong></span>
                    </div>
                    <div class="dual-bar-stack">
                      <div class="bar-track-line">
                        <div class="bar-fill-base" style="width:${pct(baseDays)}%;"></div>
                      </div>
                      <div class="bar-track-line">
                        <div class="bar-fill-sim" style="width:${pct(intDays)}%;background:${intBarColor};"></div>
                      </div>
                    </div>
                  </div>
                `;
              })
              .join('')}

            <button class="btn btn-rovo-copy" id="btn-copy-rovo-prompt">
              ${copiedPromptNotice ? '✓ Copied Rovo Mitigation Prompt to Clipboard!' : '📋 Copy Rovo Mitigation Prompt'}
            </button>
          </div>
        </div>
      </div>

      <!-- Atlassian Teamwork Graph (TWG) Goals Impact Card -->
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-title">
            🧭 Atlassian Teamwork Graph (TWG) Goals
          </div>
          <span class="badge-pill cyan">${activeSim.goalImpacts.length} Goals</span>
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
                  ? `+${goal.rippleDelayDays}d`
                  : goal.rippleDelayDays < 0
                    ? `${goal.rippleDelayDays}d`
                    : '';

              return `
                <div class="goal-card ${statusClass}">
                  <div class="goal-top">
                    <div>
                      <div style="font-size:10.5px;font-family:var(--font-mono);color:var(--text-secondary);">
                        ${escapeHtmlScenario(goal.goalKey)} · Team: ${escapeHtmlScenario(goal.ownerTeam)}
                      </div>
                      <div class="goal-name">${escapeHtmlScenario(goal.goalName)}</div>
                    </div>
                    <span class="badge-pill ${pillVariant}">${escapeHtmlScenario(goal.status)}</span>
                  </div>
                  <div class="goal-dates-row">
                    <span>Target: <strong>${escapeHtmlScenario(goal.targetDate)}</strong></span>
                    <span>Sim P85: <strong>${escapeHtmlScenario(goal.p85CompletionDate)}</strong> ${shiftSign ? `<em style="color:${goal.rippleDelayDays > 0 ? '#fb7185' : '#34d399'};">(${shiftSign})</em>` : ''}</span>
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

      <!-- Downstream Affected Tickets & Bottlenecks & Rovo/MCP Tabs -->
      <div class="panel-card">
        <div class="tab-bar">
          <button class="tab-btn ${activeRightTab === 'cascade' ? 'active' : ''}" data-tab="cascade">
            🌊 Downstream Tickets (${activeSim.blastRadiusNodes.length})
          </button>
          <button class="tab-btn ${activeRightTab === 'bottlenecks' ? 'active' : ''}" data-tab="bottlenecks">
            🚧 Top Bottlenecks (${activeSim.topBottlenecks.length})
          </button>
          <button class="tab-btn ${activeRightTab === 'rovo-mcp' ? 'active' : ''}" data-tab="rovo-mcp">
            🤖 Rovo &amp; MCP Spec
          </button>
        </div>
        <div class="tab-body">
          ${renderTabBody(props)}
        </div>
      </div>
    </div>
  `;
}

