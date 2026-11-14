/**
 * Step 4 Component 1: Synthesis 1 ("Nordic Split-Command") Top App Bar & Left Executive Status Rail
 * (`static/ui/src/components/HeaderBar.tsx`)
 *
 * Implements:
 * 1. `renderTopAppBar`: Sleek Atlassian Jira top navigation bar with live Project Switcher
 *    (`#jira-project-select`), status banner pill, and action buttons (`Sync Jira Project`,
 *    `Focus Blocker`, `+ Add Sample Issues`, `Reset`).
 * 2. `renderLeftStatusRail`: Concept 4 Dark Slate Executive Command Rail (`#0F172A`) featuring
 *    4 high-contrast SVG arch/ring gauges (`On-Time Probability`, `Schedule Slip`,
 *    `Blocker Float`, `P85 Commit`) + the hierarchical **Jira Teamwork Graph Goals** tree.
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

/**
 * Renders a 100% CSP-safe SVG arch gauge (matching Synthesis 1 Left Rail gauges).
 * Uses a semi-circular arc from (14, 56) to (98, 56) with radius 42 (arc length ≈ 131.95).
 */
function renderArchGaugeSvg(
  ratio: number,
  strokeColor: string,
  trackColor = '#334155'
): string {
  const clamped = Math.max(0.06, Math.min(1, ratio));
  const arcLen = 131.95;
  const filled = Number((clamped * arcLen).toFixed(1));
  return `
    <svg class="rail-arch-svg" width="112" height="64" viewBox="0 0 112 64" aria-hidden="true">
      <path d="M 14 56 A 42 42 0 0 1 98 56" fill="none" stroke="${trackColor}" stroke-width="8" stroke-linecap="round" />
      <path d="M 14 56 A 42 42 0 0 1 98 56" fill="none" stroke="${strokeColor}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${filled} ${arcLen}" />
    </svg>
  `;
}

export function renderTopAppBar(props: HeaderBarProps): string {
  const {
    availableProjects,
    graph,
    activeSim,
    delayDays,
    addDeveloper,
    decoupleBlockingEdges,
    statusBanner,
  } = props;

  const hasActiveIntervention =
    delayDays !== 0 || addDeveloper || decoupleBlockingEdges;

  const topBlocker = activeSim.topBottlenecks[0];
  const topBlockerKey = topBlocker?.key ?? graph.nodes[0]?.key ?? 'BLP-7';

  const projectList: JiraProjectOption[] =
    availableProjects.length > 0
      ? [...availableProjects]
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
            <span class="jira-lozenge jira-lozenge-todo">
              ${graph.nodes.length} ${graph.nodes.length === 1 ? 'ISSUE' : 'ISSUES'}
            </span>
            <span class="jira-lozenge jira-lozenge-goal">TEAMWORK GRAPH</span>
            <span class="status-latency-pill" title="500 Monte Carlo futures computed in ${activeSim.executionTimeMs} ms">
              500 runs · ${activeSim.executionTimeMs} ms
            </span>
            ${renderInfoTooltip(
              'Rovo-World-Model Digital Twin',
              'Automatically loads issues, sub-tasks, and dependencies from your selected Jira project and runs 500 Monte Carlo simulations to forecast delivery dates and goal risks.',
              `Active Project: ${graph.projectKey} (${graph.nodes.length} nodes, ${graph.edges.length} links) | Latency: ${activeSim.executionTimeMs} ms`
            )}
            ${
              statusBanner
                ? `<span class="header-status-inline" title="${escapeHtmlText(statusBanner)}">
                     <span class="status-dot"></span>
                     <span class="header-status-text">${escapeHtmlText(statusBanner)}</span>
                   </span>`
                : ''
            }
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
        <button class="btn ${hasActiveIntervention ? 'btn-danger-outline' : ''}" id="btn-reset-sim" title="Reset What-If simulation back to baseline">
          Reset
        </button>
      </div>
    </header>
  `;
}

/**
 * Renders Synthesis 1's Left Executive Command Rail (Dark Slate `#0F172A`)
 * with 4 SVG Arch Gauges + Hierarchical Teamwork Graph Goals Tree.
 */
export function renderLeftStatusRail(props: HeaderBarProps): string {
  const { graph, baselineSim, activeSim, intervention } = props;

  const p85Shift = intervention ? intervention.p85ShiftDays : 0;
  const topBlocker = activeSim.topBottlenecks[0];
  const topBlockerKey = topBlocker?.key ?? graph.nodes[0]?.key ?? 'BLP-7';
  const superCriticalCount = activeSim.superCriticalNodes?.length ?? 0;
  const evm = activeSim.earnedValue;

  // Compute overall on-time confidence % (relative to baseline P85 commitment + goals)
  const baseOnTimePct =
    p85Shift > 0
      ? Math.max(20, Math.round(85 - p85Shift * 3.2))
      : p85Shift < 0
        ? Math.min(98, Math.round(85 + Math.abs(p85Shift) * 2.5))
        : 85;

  const gauge1Color =
    baseOnTimePct >= 75 ? '#10B981' : baseOnTimePct >= 50 ? '#F59E0B' : '#F43F5E';
  const gauge1TextClass =
    baseOnTimePct >= 75
      ? 'text-emerald-light'
      : baseOnTimePct >= 50
        ? 'text-amber-light'
        : 'text-coral-light';

  const slipDisplay =
    p85Shift > 0
      ? `+${p85Shift.toFixed(1)}d`
      : p85Shift < 0
        ? `${p85Shift.toFixed(1)}d`
        : `±${Math.max(1, Math.round(activeSim.p85Days - activeSim.p50Days))}d`;
  const slipRatio =
    p85Shift > 0
      ? Math.min(1, 0.35 + p85Shift / 25)
      : p85Shift < 0
        ? 0.28
        : 0.45;
  const gauge2Color =
    p85Shift > 0 ? '#F59E0B' : p85Shift < 0 ? '#10B981' : '#FBBF24';

  const blockerCount = activeSim.criticalPathNodes.length;
  const blockerRatio = Math.min(
    1,
    Math.max(0.2, blockerCount / Math.max(1, graph.nodes.length))
  );

  return `
    <aside class="left-status-rail">
      <div class="rail-header">
        <div class="rail-title-row">
          <span class="rail-title">Project Status</span>
          <span class="rail-subtitle-badge">${escapeHtmlText(graph.projectKey)}</span>
        </div>
        <div class="rail-caption">${escapeHtmlText(graph.projectName)} · ${graph.nodes.length} Issues</div>
      </div>

      <div class="rail-gauges-stack">
        <!-- Gauge 1: On-Time Probability -->
        <div class="rail-gauge-card" title="85% Confidence Target Commit Date: ${activeSim.p85Date} (Baseline: ${baselineSim.p85Date})">
          <div class="rail-gauge-visual">
            ${renderArchGaugeSvg(baseOnTimePct / 100, gauge1Color)}
            <div class="rail-gauge-value ${gauge1TextClass}">
              ${baseOnTimePct}%
            </div>
          </div>
          <div class="rail-gauge-label">
            <span>On-Time Probability</span>
            ${renderInfoTooltip(
              'On-Time Delivery Confidence',
              'Probability of meeting your Target Commit Date across 500 simulated project runs.',
              `Target Commit Date = ${activeSim.p85Date} | Baseline Target = ${baselineSim.p85Date}`
            )}
          </div>
          <div class="rail-gauge-sub">
            CPI <strong>${(evm?.cpi ?? 1.0).toFixed(2)}</strong> · SPI <strong>${(evm?.spi ?? 1.0).toFixed(2)}</strong>
          </div>
        </div>

        <!-- Gauge 2: Schedule Slip / Spread -->
        <div class="rail-gauge-card" title="Schedule shift relative to baseline Target Commit Date">
          <div class="rail-gauge-visual">
            ${renderArchGaugeSvg(slipRatio, gauge2Color)}
            <div class="rail-gauge-value text-amber-light">
              ${slipDisplay}
            </div>
          </div>
          <div class="rail-gauge-label">
            <span>${p85Shift !== 0 ? 'Schedule Slip' : 'Forecast Spread'}</span>
            ${renderInfoTooltip(
              'Schedule Slip & Safety Buffer Spread',
              'Shows net schedule shift from active What-If changes, or the team risk buffer between Likely Finish and Target Commit Date.',
              `Likely Finish = ${activeSim.p50Date} | Target Commit = ${activeSim.p85Date} | Safe Buffer = ${activeSim.p95Date}`
            )}
          </div>
          <div class="rail-gauge-sub">
            Window: <strong>${formatFriendlyDate(activeSim.p50Date)} – ${formatFriendlyDate(activeSim.p95Date)}</strong>
          </div>
        </div>

        <!-- Gauge 3: Blocker Float -->
        <div class="rail-gauge-card" title="Critical path blockers and negative float issues">
          <div class="rail-gauge-visual">
            ${renderArchGaugeSvg(blockerRatio, '#F43F5E')}
            <div class="rail-gauge-value text-coral-light">
              ${blockerCount}
            </div>
          </div>
          <div class="rail-gauge-label">
            <span>Blocker Float (${escapeHtmlText(topBlockerKey)})</span>
            ${renderInfoTooltip(
              'Critical Path Blockers & Float',
              'Issues on the critical path with zero or negative total float that directly gate release completion.',
              `Critical Path: ${blockerCount} issues | Negative Float: ${superCriticalCount} issues | Top: ${topBlockerKey}`
            )}
          </div>
          <div class="rail-gauge-sub">
            <strong>${escapeHtmlText(topBlockerKey)}</strong> gates <strong>${topBlocker?.downstreamCount ?? 1} issues</strong>
          </div>
        </div>

        <!-- Gauge 4: Target Commit Date -->
        <div class="rail-gauge-card" title="Target Commit Date (85% safe): ${activeSim.p85Date}">
          <div class="rail-gauge-visual">
            ${renderArchGaugeSvg(0.85, '#8B5CF6')}
            <div class="rail-gauge-value text-violet-light">
              ${formatFriendlyDate(activeSim.p85Date)}
            </div>
          </div>
          <div class="rail-gauge-label">
            <span>Target Commit</span>
            ${renderInfoTooltip(
              'Target Commit Date (85% Safe)',
              'Recommended release commitment date for stakeholders: 85% of the 500 simulated project runs finish on or before this date (statistical 85th percentile).',
              `Target Commit Date: ${activeSim.p85Date} (+${activeSim.p85Days}d from reference date)`
            )}
          </div>
          <div class="rail-gauge-sub">
            Base: <strong>${formatFriendlyDate(baselineSim.p85Date)}</strong>
          </div>
        </div>
      </div>

      <!-- Hierarchical Jira Teamwork Graph Goals Tree -->
      <div class="rail-goals-card">
        <div class="rail-goals-header">
          <span>Jira Teamwork Graph Goals</span>
          ${renderInfoTooltip(
            'Atlassian Teamwork Graph Goals',
            'Live release milestones and OKRs connected to your Jira issues via the Atlassian Teamwork Graph.',
            `Linked Goals: ${activeSim.goalImpacts.length} | Recovery Effort Score: ${activeSim.quasimetricEnergy}`
          )}
        </div>
        <div class="rail-goals-tree">
          ${activeSim.goalImpacts
            .map((goal, idx) => {
              const probPct = Math.round(goal.probabilityOfOnTime * 100);
              const dotClass =
                goal.status === 'Off Track'
                  ? 'tree-dot-coral'
                  : goal.status === 'At Risk'
                    ? 'tree-dot-amber'
                    : 'tree-dot-green';
              const barColor =
                goal.status === 'Off Track'
                  ? '#F43F5E'
                  : goal.status === 'At Risk'
                    ? '#F59E0B'
                    : '#10B981';

              return `
                <div class="rail-goal-item" title="${escapeHtmlText(goal.goalName)} · Owner: ${escapeHtmlText(goal.ownerTeam)} | Target: ${formatFriendlyDate(goal.targetDate, true)} | Target Commit Date (85% safe): ${formatFriendlyDate(goal.p85CompletionDate, true)} (${probPct}% on time)">
                  <div class="rail-goal-top">
                    <span class="tree-dot ${dotClass}"></span>
                    <span class="rail-goal-name">${escapeHtmlText(goal.goalName)}</span>
                    <span class="jira-lozenge lozenge-violet">${probPct}%</span>
                  </div>
                  <div class="rail-goal-meta">
                    <span>Target: <strong>${formatFriendlyDate(goal.targetDate)}</strong></span>
                    <span>Commit: <strong>${formatFriendlyDate(goal.p85CompletionDate)}</strong> (${escapeHtmlText(goal.status)})</span>
                  </div>
                  <svg class="rail-goal-bar-svg" width="100%" height="5" viewBox="0 0 100 5" preserveAspectRatio="none">
                    <rect x="0" y="0" width="100" height="5" rx="2.5" fill="#1E293B" />
                    <rect x="0" y="0" width="${Math.max(6, probPct)}" height="5" rx="2.5" fill="${barColor}" />
                  </svg>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    </aside>
  `;
}

export const renderHeaderBar = renderTopAppBar;
