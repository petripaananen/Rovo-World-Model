/**
 * Step 4 Component 1: Header Bar & Judge Controls (`static/ui/src/components/HeaderBar.tsx`)
 *
 * - App title: "Rovo World Model — Causal Time Machine"
 * - Active data badge: "Live Jira + TWG Data" or "Demo Scenario: Project Chronos (18 Nodes)"
 * - "Load Demo Scenario" Button (`invoke('loadDemoScenario')`) & "Create Real Jira Issues" Button
 * - KPI Summary Pills:
 *   1. Baseline P85 Completion Date vs. Simulated P85 Date (with Δ days badge in red/green)
 *   2. Active Critical Bottlenecks count
 *   3. Affected Teamwork Graph Goals count
 */

import {
  CausalGraph,
  InterventionResult,
  SimulationResult,
} from '../../../../src/engine/types';

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

function escapeHtmlHeader(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

  const p50Shift = intervention ? intervention.p50ShiftDays : 0;
  const p85Shift = intervention ? intervention.p85ShiftDays : 0;
  const p95Shift = intervention ? intervention.p95ShiftDays : 0;

  const hasActiveIntervention =
    delayDays !== 0 || addDeveloper || decoupleBlockingEdges;

  const dataBadgeLabel = graph.isSyntheticDemo
    ? `Demo Scenario: Project Chronos (${graph.nodes.length} Nodes)`
    : 'Live Jira + TWG Data';

  const affectedGoalsCount = activeSim.goalImpacts.filter(
    (g) => g.status !== 'On Track' || Math.abs(g.rippleDelayDays) > 0
  ).length;

  const formatDeltaBadge = (shift: number, defaultText: string): string => {
    if (shift > 0) {
      return `<span class="kpi-delta delayed">+${shift}d</span>`;
    }
    if (shift < 0) {
      return `<span class="kpi-delta baseline">${shift}d</span>`;
    }
    return `<span class="kpi-delta baseline">${defaultText}</span>`;
  };

  return `
    <header class="cockpit-header">
      <div class="brand-cluster">
        <div class="brand-orb">RWM</div>
        <div class="brand-titles">
          <h1>
            Rovo-World-Model
            <span class="badge-pill ${graph.isSyntheticDemo ? 'cyan' : 'emerald'}">
              ${escapeHtmlHeader(dataBadgeLabel)}
            </span>
            <span class="badge-pill">Codegeist 2026</span>
          </h1>
          <div class="brand-subtitle">
            Causal AI Digital Twin &amp; Time Machine · Atlassian Teamwork Graph (TWG) · 500-Iteration CRN Monte Carlo ($do$-Calculus)
          </div>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" id="btn-load-demo" title="Load 18-node Project Chronos causal graph">
          ⚡ Load Demo Scenario
        </button>
        <button class="btn" id="btn-create-jira-issues" title="Populate real linked Jira issues via Jira REST API">
          ➕ Create Real Jira Issues
        </button>
        <button class="btn" id="btn-jump-bottleneck">
          🎯 Focus Top Bottleneck (${escapeHtmlHeader(activeSim.topBottlenecks[0]?.key ?? 'CHRON-104')})
        </button>
        <button class="btn ${hasActiveIntervention ? 'btn-danger-outline' : ''}" id="btn-reset-sim">
          ↺ Reset Scenario
        </button>
      </div>
    </header>

    ${
      statusBanner
        ? `<div class="status-banner-bar">
             <span>✨ ${escapeHtmlHeader(statusBanner)}</span>
             <span style="font-family:var(--font-mono);font-size:11px;color:#67e8f9;">
               Engine Latency: ${activeSim.executionTimeMs} ms / 500 worlds
             </span>
           </div>`
        : ''
    }

    <!-- KPI SUMMARY PILLS -->
    <section class="kpi-strip">
      <div class="kpi-card ${p85Shift > 0 ? 'highlight-shift' : p85Shift < 0 ? 'highlight-accel' : ''}">
        <div class="kpi-label">
          <span>Baseline vs. Simulated P85 Date</span>
          <span class="badge-pill cyan">85% Commit</span>
        </div>
        <div class="kpi-value">
          ${escapeHtmlHeader(activeSim.p85Date)}
          ${formatDeltaBadge(p85Shift, '0d Shift')}
        </div>
        <div class="kpi-sub">
          Baseline P85: <strong>${escapeHtmlHeader(baselineSim.p85Date)}</strong> (+${baselineSim.p85Days}d)
        </div>
      </div>

      <div class="kpi-card ${p50Shift > 0 ? 'highlight-shift' : p50Shift < 0 ? 'highlight-accel' : ''}">
        <div class="kpi-label">
          <span>P50 Median &amp; P95 Tail Cone</span>
          <span class="badge-pill">P50 / P95</span>
        </div>
        <div class="kpi-value">
          ${escapeHtmlHeader(activeSim.p50Date)}
          ${formatDeltaBadge(p50Shift, 'Baseline')}
        </div>
        <div class="kpi-sub">
          P95 Tail Envelope: <strong>${escapeHtmlHeader(activeSim.p95Date)}</strong> (${p95Shift >= 0 ? `+${p95Shift}d` : `${p95Shift}d`})
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">
          <span>Active Critical Bottlenecks</span>
          <span class="badge-pill amber">Critical Path</span>
        </div>
        <div class="kpi-value">
          ${activeSim.criticalPathNodes.length} Bottlenecks
          <span class="kpi-delta delayed">Top: ${escapeHtmlHeader(activeSim.topBottlenecks[0]?.key ?? 'CHRON-104')}</span>
        </div>
        <div class="kpi-sub">
          Max Ripple Weight: <strong>${activeSim.topBottlenecks[0]?.downstreamRippleWeight ?? 9.5}</strong> (${activeSim.topBottlenecks[0]?.downstreamCount ?? 10} downstream tasks)
        </div>
      </div>

      <div class="kpi-card ${affectedGoalsCount > 0 && p85Shift > 0 ? 'highlight-shift' : ''}">
        <div class="kpi-label">
          <span>Affected Teamwork Graph Goals</span>
          <span class="badge-pill ${affectedGoalsCount > 0 && p85Shift > 0 ? 'rose' : 'emerald'}">TWG Goals</span>
        </div>
        <div class="kpi-value">
          ${affectedGoalsCount} / ${activeSim.goalImpacts.length} Goals
          <span class="kpi-delta ${affectedGoalsCount > 0 && p85Shift > 0 ? 'delayed' : 'baseline'}">
            ${affectedGoalsCount > 0 && p85Shift > 0 ? 'At Risk' : 'Aligned'}
          </span>
        </div>
        <div class="kpi-sub">
          Goals: ${activeSim.goalImpacts.map((g) => `${escapeHtmlHeader(g.goalName)} (${g.status})`).join(' · ')}
        </div>
      </div>

      <div class="kpi-card ${hasActiveIntervention ? 'highlight-shift' : ''}">
        <div class="kpi-label">
          <span>Causal Blast Radius</span>
          <span class="badge-pill cyan">do(${escapeHtmlHeader(selectedNodeKey)})</span>
        </div>
        <div class="kpi-value">
          ${hasActiveIntervention ? `${activeSim.blastRadiusNodes.length} Issues` : '0 Issues'}
          ${formatDeltaBadge(activeSim.rippleDelayDays, 'No Shock')}
        </div>
        <div class="kpi-sub">
          ${
            hasActiveIntervention
              ? `Propagated across ${graph.teams.length} teams`
              : 'Slide Delay/Accelerate (-5d to +30d) to test'
          }
        </div>
      </div>
    </section>
  `;
}

