/**
 * Step 4 Component 1: Executive Header Bar & 4-Card KPI Strip (`static/ui/src/components/HeaderBar.tsx`)
 *
 * Designed for 3-second executive clarity:
 * - Human-readable product subtitle (all math/formulas tucked behind `?` tooltips)
 * - 1-click Judge Actions: Load Demo Scenario, Create Real Jira Issues, Focus Top Blocker, Reset
 * - 4 High-Impact Executive KPI Cards:
 *   1. Projected Release Date (with slip/gain pill + hover tooltip for P85 Monte Carlo math)
 *   2. Delivery Confidence Window (Earliest Likely to Worst-Case + hover tooltip for P50-P95 & CVaR)
 *   3. Critical Path Blockers (Top gating task + hover tooltip for Criticality Index & DAG math)
 *   4. Business Goals & Impact (Teamwork Graph Goal status + affected downstream tasks)
 */

import {
  CausalGraph,
  InterventionResult,
  SimulationResult,
} from '../../../../src/engine/types';
import {
  escapeHtmlText,
  formatFriendlyDate,
  renderInfoTooltip,
} from './tooltip';

export interface HeaderBarProps {
  graph: CausalGraph;
  baselineSim: SimulationResult;
  activeSim: SimulationResult;
  intervention: InterventionResult | null;
  selectedNodeKey: string;
  delayDays: number;
  addDeveloper: boolean;
  decoupleBlockingEdges: boolean;
  statusBanner: string | null;
}

export function renderHeaderBar(props: HeaderBarProps): string {
  const {
    graph,
    baselineSim,
    activeSim,
    intervention,
    selectedNodeKey,
    delayDays,
    addDeveloper,
    decoupleBlockingEdges,
    statusBanner,
  } = props;

  const p85Shift = intervention ? intervention.p85ShiftDays : 0;
  const p95Shift = intervention ? intervention.p95ShiftDays : 0;

  const hasActiveIntervention =
    delayDays !== 0 || addDeveloper || decoupleBlockingEdges;

  const dataBadgeLabel = graph.isSyntheticDemo
    ? `Demo Scenario (${graph.nodes.length} Tasks)`
    : `Live Jira (${graph.nodes.length} Tasks)`;

  const affectedGoalsCount = activeSim.goalImpacts.filter(
    (g) => g.status !== 'On Track' || Math.abs(g.rippleDelayDays) > 0
  ).length;

  const topBlocker = activeSim.topBottlenecks[0];
  const topBlockerKey = topBlocker?.key ?? 'CHRON-104';

  const formatShiftPill = (shift: number, neutralLabel: string): string => {
    if (shift > 0) {
      return `<span class="kpi-delta delayed">+${shift}d Slip</span>`;
    }
    if (shift < 0) {
      return `<span class="kpi-delta baseline">${shift}d Faster</span>`;
    }
    return `<span class="kpi-delta neutral">${neutralLabel}</span>`;
  };

  const windowBufferDays = Math.max(
    1,
    Math.round(activeSim.p95Days - activeSim.p50Days)
  );

  return `
    <header class="cockpit-header">
      <div class="brand-cluster">
        <div class="brand-orb">RWM</div>
        <div class="brand-titles">
          <h1>
            Rovo-World-Model
            <span class="badge-pill ${graph.isSyntheticDemo ? 'cyan' : 'emerald'}">
              ${escapeHtmlText(dataBadgeLabel)}
            </span>
          </h1>
          <div class="brand-subtitle">
            Interactive Delivery Risk Simulator &amp; Project Time Machine
            ${renderInfoTooltip(
              'Under the Hood: Causal Digital Twin Engine',
              'Constructs a Directed Acyclic Graph (DAG) from Jira issues and Teamwork Graph goals, then runs 500 paired Monte Carlo simulations in under 25ms to predict cascading delivery risks before they happen.',
              'P(Release | do(Task = +Δd)) via 500 Common Random Numbers (CRN) iterations'
            )}
          </div>
        </div>
      </div>

      <div class="header-actions">
        <button class="btn btn-primary" id="btn-load-demo" title="Load the 18-task Project Chronos multi-team launch scenario">
          ⚡ Load Demo Scenario
        </button>
        <button class="btn" id="btn-create-jira-issues" title="Create real linked Jira issues in this project via Jira REST API">
          ➕ Seed Jira Issues
        </button>
        <button class="btn" id="btn-jump-bottleneck" title="Select the #1 critical path bottleneck task">
          🎯 Inspect #1 Blocker (${escapeHtmlText(topBlockerKey)})
        </button>
        <button class="btn ${hasActiveIntervention ? 'btn-danger-outline' : ''}" id="btn-reset-sim" title="Clear all what-if changes and return to baseline">
          ↺ Reset
        </button>
      </div>
    </header>

    ${
      statusBanner
        ? `<div class="status-banner-bar">
             <div class="status-banner-left">
               <span class="status-dot"></span>
               <span>${escapeHtmlText(statusBanner)}</span>
             </div>
             <span class="status-latency-pill" title="500 baseline + 500 counterfactual simulations executed in ${activeSim.executionTimeMs} ms">
               ⚡ Simulated 500 futures in ${activeSim.executionTimeMs} ms
             </span>
           </div>`
        : ''
    }

    <!-- 4-CARD EXECUTIVE KPI SUMMARY -->
    <section class="kpi-strip">
      <!-- Card 1: Projected Release Date -->
      <div class="kpi-card ${p85Shift > 0 ? 'highlight-shift' : p85Shift < 0 ? 'highlight-accel' : ''}">
        <div class="kpi-label">
          <span>🎯 Projected Release Date</span>
          ${renderInfoTooltip(
            '85% Confidence Commit Date (P85)',
            'In 85 out of 100 simulated project futures, all release tasks finish on or before this date. Compare against the original baseline to see the net impact of your What-If change.',
            `P85 = ${activeSim.p85Date} (+${activeSim.p85Days}d from today) | Baseline P85 = ${baselineSim.p85Date}`
          )}
        </div>
        <div class="kpi-value">
          <span>${formatFriendlyDate(activeSim.p85Date, true)}</span>
          ${formatShiftPill(p85Shift, 'On Track')}
        </div>
        <div class="kpi-sub">
          Original Target: <strong>${formatFriendlyDate(baselineSim.p85Date, true)}</strong> (85% confidence)
        </div>
      </div>

      <!-- Card 2: Delivery Risk Window -->
      <div class="kpi-card">
        <div class="kpi-label">
          <span>📅 Delivery Forecast Range</span>
          ${renderInfoTooltip(
            'Probability Cone & Tail Risk (P50 – P95 & CVaR)',
            'Shows the spread between the Likely Median finish date (50% chance) and the Worst-Case finish date (95% chance), plus the Extreme Tail Risk (worst 5% average).',
            `P50=${activeSim.p50Date} | P95=${activeSim.p95Date} (${p95Shift >= 0 ? `+${p95Shift}d` : `${p95Shift}d`}) | CVaR₀.₉₅=${activeSim.cvar95Date}`
          )}
        </div>
        <div class="kpi-value">
          <span>${formatFriendlyDate(activeSim.p50Date)} – ${formatFriendlyDate(activeSim.p95Date)}</span>
          <span class="kpi-delta neutral">±${windowBufferDays}d Window</span>
        </div>
        <div class="kpi-sub">
          Likely (50%): <strong>${formatFriendlyDate(activeSim.p50Date)}</strong> · Worst-Case (95%): <strong>${formatFriendlyDate(activeSim.p95Date)}</strong>
        </div>
      </div>

      <!-- Card 3: Critical Bottlenecks -->
      <div class="kpi-card">
        <div class="kpi-label">
          <span>🚧 Critical Path Blockers</span>
          ${renderInfoTooltip(
            'Topological Critical Path & Ripple Weight',
            'Tasks that directly gate the final release date. Any delay on a critical blocker immediately delays downstream teams unless decoupled.',
            `Critical Path (${activeSim.criticalPathNodes.length} nodes) | Top Blocker ${topBlockerKey} Ripple Weight = ${topBlocker?.downstreamRippleWeight ?? 9.5}`
          )}
        </div>
        <div class="kpi-value">
          <span>${activeSim.criticalPathNodes.length} Gating Tasks</span>
          <span class="kpi-delta delayed">#1: ${escapeHtmlText(topBlockerKey)}</span>
        </div>
        <div class="kpi-sub">
          <strong>${escapeHtmlText(topBlockerKey)}</strong> gates <strong>${topBlocker?.downstreamCount ?? 10} downstream tasks</strong> across teams
        </div>
      </div>

      <!-- Card 4: Business Goals & Downstream Impact -->
      <div class="kpi-card ${affectedGoalsCount > 0 && p85Shift > 0 ? 'highlight-shift' : ''}">
        <div class="kpi-label">
          <span>🧭 Goals &amp; Downstream Impact</span>
          ${renderInfoTooltip(
            'Atlassian Teamwork Graph (TWG) Goal Alignment',
            'Tracks how task-level delays ripple up into company-level Teamwork Graph Goals and across dependent engineering teams.',
            `Active What-If on ${selectedNodeKey}: ${activeSim.blastRadiusNodes.length} downstream tasks shifted | Friction E = ${activeSim.quasimetricEnergy}`
          )}
        </div>
        <div class="kpi-value">
          <span>${
            hasActiveIntervention
              ? `${activeSim.blastRadiusNodes.length} Tasks Impacted`
              : `${activeSim.goalImpacts.length} Goals Tracked`
          }</span>
          <span class="kpi-delta ${affectedGoalsCount > 0 && p85Shift > 0 ? 'delayed' : 'baseline'}">
            ${
              affectedGoalsCount > 0 && p85Shift > 0
                ? `${affectedGoalsCount} Goal At Risk`
                : 'Goals On Track'
            }
          </span>
        </div>
        <div class="kpi-sub">
          ${activeSim.goalImpacts
            .map((g) => `${escapeHtmlText(g.goalName)}: <strong>${g.status}</strong>`)
            .join(' · ')}
        </div>
      </div>
    </section>
  `;
}
