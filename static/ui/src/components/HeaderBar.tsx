/**
 * Step 4 Component 1: Atlassian Jira-Native Header Bar & 4-Card Summary Strip (`static/ui/src/components/HeaderBar.tsx`)
 *
 * Designed via Stitch MCP & Atlassian Design System (ADS):
 * - Native Jira Breadcrumb (`Spaces / [Project Switcher Dropdown] / Rovo-World-Model`)
 * - Switches dynamically across the user's real Jira projects (e.g., BloomPath Sprint, Triton)
 * - Clean Atlassian action buttons: `Sync Live Jira`, `Focus #1 Blocker`, `Seed Sample Tasks`, `Reset`
 * - 4 Atlassian Executive Summary Cards with rectangular ADS lozenges (`ON TRACK`, `AT RISK`, `BLOCKER`)
 *   and progressive-disclosure `?` tooltips for all underlying math.
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

export interface JiraProjectOption {
  id: string;
  key: string;
  name: string;
}

export interface HeaderBarProps {
  availableProjects: JiraProjectOption[];
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
    availableProjects,
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

  const affectedGoalsCount = activeSim.goalImpacts.filter(
    (g) => g.status !== 'On Track' || Math.abs(g.rippleDelayDays) > 0
  ).length;

  const topBlocker = activeSim.topBottlenecks[0];
  const topBlockerKey = topBlocker?.key ?? graph.nodes[0]?.key ?? 'BLP-7';

  const windowBufferDays = Math.max(
    1,
    Math.round(activeSim.p95Days - activeSim.p50Days)
  );

  const projectList: JiraProjectOption[] =
    availableProjects.length > 0
      ? availableProjects
      : [
          {
            id: graph.projectKey,
            key: graph.projectKey,
            name: graph.projectName,
          },
        ];

  const hasCurrentInList = projectList.some((p) => p.key === graph.projectKey);
  if (!hasCurrentInList) {
    projectList.unshift({
      id: graph.projectKey,
      key: graph.projectKey,
      name: graph.projectName,
    });
  }

  const releaseLozenge =
    p85Shift > 0
      ? `<span class="jira-lozenge jira-lozenge-danger">+${p85Shift}D SLIP</span>`
      : p85Shift < 0
        ? `<span class="jira-lozenge jira-lozenge-done">${p85Shift}D FASTER</span>`
        : `<span class="jira-lozenge jira-lozenge-done">ON TRACK</span>`;

  return `
    <header class="cockpit-header">
      <div class="brand-cluster">
        <div class="jira-project-avatar" title="${escapeHtmlText(graph.projectName)} (${escapeHtmlText(graph.projectKey)})">
          ${escapeHtmlText(graph.projectKey.slice(0, 3))}
        </div>
        <div class="brand-titles">
          <div class="jira-breadcrumbs">
            <span>Spaces</span>
            <span class="crumb-sep">/</span>
            <select id="jira-project-select" class="jira-project-select" title="Switch active Jira project">
              ${projectList
                .map(
                  (p) => `
                  <option value="${escapeHtmlText(p.key)}" ${p.key === graph.projectKey ? 'selected' : ''}>
                    ${escapeHtmlText(p.name)} (${escapeHtmlText(p.key)})
                  </option>
                `
                )
                .join('')}
            </select>
            <span class="crumb-sep">/</span>
            <span class="crumb-current">Rovo-World-Model</span>
          </div>
          <div class="brand-heading-row">
            <h1>${escapeHtmlText(graph.projectName)}</h1>
            <span class="jira-lozenge jira-lozenge-todo">
              ${graph.nodes.length} ${graph.nodes.length === 1 ? 'ISSUE' : 'ISSUES'}
            </span>
            <span class="jira-lozenge jira-lozenge-goal">TEAMWORK GRAPH</span>
            ${renderInfoTooltip(
              'Rovo-World-Model Digital Twin',
              'Automatically loads issues and dependencies from your selected Jira project and runs 500 Monte Carlo simulations to forecast delivery dates and goal risks.',
              `Active Project: ${graph.projectKey} (${graph.nodes.length} nodes, ${graph.edges.length} links) | Latency: ${activeSim.executionTimeMs} ms`
            )}
          </div>
        </div>
      </div>

      <div class="header-actions">
        <button class="btn btn-primary" id="btn-sync-jira" title="Refresh live issues and dependency links from Jira">
          ↻ Sync Jira Project
        </button>
        <button class="btn" id="btn-jump-bottleneck" title="Select the #1 critical path blocker issue">
          🎯 Focus Blocker (${escapeHtmlText(topBlockerKey)})
        </button>
        <button class="btn" id="btn-create-jira-issues" title="Populate linked sample issues into this Jira project via REST API">
          ➕ Add Sample Issues
        </button>
        <button class="btn ${hasActiveIntervention ? 'btn-danger-outline' : ''}" id="btn-reset-sim" title="Reset What-If simulation back to baseline">
          Reset
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
             <span class="status-latency-pill" title="500 Monte Carlo futures computed in ${activeSim.executionTimeMs} ms">
               500 simulations · ${activeSim.executionTimeMs} ms
             </span>
           </div>`
        : ''
    }

    <!-- 4-CARD ATLASSIAN EXECUTIVE SUMMARY STRIP -->
    <section class="kpi-strip">
      <!-- Card 1: Projected Release Date -->
      <div class="kpi-card ${p85Shift > 0 ? 'highlight-shift' : p85Shift < 0 ? 'highlight-accel' : ''}">
        <div class="kpi-label">
          <span>PROJECTED RELEASE DATE</span>
          ${renderInfoTooltip(
            '85% Confidence Commit Date (P85)',
            'Statistically, 85 out of 100 simulated project runs finish on or before this date. Compare with the baseline target to see the impact of your What-If change.',
            `P85 = ${activeSim.p85Date} (+${activeSim.p85Days}d) | Baseline P85 = ${baselineSim.p85Date}`
          )}
        </div>
        <div class="kpi-value">
          <span>${formatFriendlyDate(activeSim.p85Date, true)}</span>
          ${releaseLozenge}
        </div>
        <div class="kpi-sub">
          Baseline Target: <strong>${formatFriendlyDate(baselineSim.p85Date, true)}</strong> (85% confidence)
        </div>
      </div>

      <!-- Card 2: Delivery Forecast Window -->
      <div class="kpi-card">
        <div class="kpi-label">
          <span>DELIVERY FORECAST WINDOW</span>
          ${renderInfoTooltip(
            'Probability Cone & Tail Risk (P50 – P95 & CVaR)',
            'Shows the window between Likely Median completion (50% probability) and Worst-Case Buffer (95% probability).',
            `P50=${activeSim.p50Date} | P95=${activeSim.p95Date} (${p95Shift >= 0 ? `+${p95Shift}d` : `${p95Shift}d`}) | CVaR₀.₉₅=${activeSim.cvar95Date}`
          )}
        </div>
        <div class="kpi-value">
          <span>${formatFriendlyDate(activeSim.p50Date)} – ${formatFriendlyDate(activeSim.p95Date)}</span>
          <span class="jira-lozenge jira-lozenge-todo">±${windowBufferDays}D SPREAD</span>
        </div>
        <div class="kpi-sub">
          Likely (50%): <strong>${formatFriendlyDate(activeSim.p50Date)}</strong> · Buffer (95%): <strong>${formatFriendlyDate(activeSim.p95Date)}</strong>
        </div>
      </div>

      <!-- Card 3: Critical Blockers -->
      <div class="kpi-card">
        <div class="kpi-label">
          <span>CRITICAL PATH BLOCKERS</span>
          ${renderInfoTooltip(
            'Topological Critical Path',
            'Issues with zero or near-zero schedule slack that directly gate the project completion date.',
            `Critical Path (${activeSim.criticalPathNodes.length} issues) | Top Blocker ${topBlockerKey} Ripple Weight = ${topBlocker?.downstreamRippleWeight ?? 1.0}`
          )}
        </div>
        <div class="kpi-value">
          <span>${activeSim.criticalPathNodes.length} ${activeSim.criticalPathNodes.length === 1 ? 'Blocker' : 'Blockers'}</span>
          <span class="jira-lozenge jira-lozenge-inprogress">TOP: ${escapeHtmlText(topBlockerKey)}</span>
        </div>
        <div class="kpi-sub">
          <strong>${escapeHtmlText(topBlockerKey)}</strong> impacts <strong>${topBlocker?.downstreamCount ?? 1} downstream ${
            (topBlocker?.downstreamCount ?? 1) === 1 ? 'issue' : 'issues'
          }</strong>
        </div>
      </div>

      <!-- Card 4: Teamwork Graph Goals -->
      <div class="kpi-card ${affectedGoalsCount > 0 && p85Shift > 0 ? 'highlight-shift' : ''}">
        <div class="kpi-label">
          <span>TEAMWORK GRAPH GOALS</span>
          ${renderInfoTooltip(
            'Atlassian Teamwork Graph Alignment',
            'Connects project issues to high-level Teamwork Graph Goals and tracks on-time delivery probability.',
            `Selected: ${selectedNodeKey} | Downstream Impact: ${activeSim.blastRadiusNodes.length} issues | Friction E = ${activeSim.quasimetricEnergy}`
          )}
        </div>
        <div class="kpi-value">
          <span>${
            hasActiveIntervention
              ? `${activeSim.blastRadiusNodes.length} Impacted`
              : `${activeSim.goalImpacts.length} Goals Linked`
          }</span>
          <span class="jira-lozenge ${affectedGoalsCount > 0 && p85Shift > 0 ? 'jira-lozenge-danger' : 'jira-lozenge-done'}">
            ${affectedGoalsCount > 0 && p85Shift > 0 ? 'AT RISK' : 'HEALTHY'}
          </span>
        </div>
        <div class="kpi-sub">
          ${activeSim.goalImpacts
            .map((g) => `${escapeHtmlText(g.goalName)} (${g.status})`)
            .join(' · ')}
        </div>
      </div>
    </section>
  `;
}
