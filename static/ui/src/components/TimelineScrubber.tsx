/**
 * Step 4 Component 3: Atlassian Jira-Native Timeline Scrubber (`static/ui/src/components/TimelineScrubber.tsx`)
 *
 * Clean Jira Plans / Timeline bar with rectangular ADS status lozenges (`DONE`, `IN PROGRESS`, `AT RISK`, `TO DO`)
 * and human-friendly milestone buttons.
 */

import { addCalendarDays } from '../../../../src/engine/dag';
import {
  CausalGraph,
  CausalNode,
  NodeSimulationStats,
  SimulationResult,
} from '../../../../src/engine/types';
import {
  escapeHtmlText,
  formatFriendlyDate,
  renderInfoTooltip,
} from './tooltip';

export type TemporalNodeState = 'Done' | 'In Progress' | 'At Risk / Blocked' | 'Scheduled';

export function evaluateNodeTemporalState(
  node: CausalNode,
  stat: NodeSimulationStats | undefined,
  scrubberDayOffset: number,
  hasActiveIntervention: boolean
): TemporalNodeState {
  const statusLower = node.status.toLowerCase();

  if (scrubberDayOffset === 0) {
    if (statusLower === 'done') return 'Done';
    if (statusLower === 'blocked' || (hasActiveIntervention && (stat?.rippleDelayDays ?? 0) >= 3)) {
      return 'At Risk / Blocked';
    }
    if (statusLower === 'in progress') return 'In Progress';
    return 'Scheduled';
  }

  if (scrubberDayOffset < 0) {
    const completedAgo = node.completedDaysAgo ?? 14;
    if (statusLower === 'done' && scrubberDayOffset >= -completedAgo) {
      return 'Done';
    }
    if (statusLower === 'done' && scrubberDayOffset >= -(completedAgo + 10)) {
      return 'In Progress';
    }
    if (statusLower === 'in progress' && scrubberDayOffset >= -7) {
      return 'In Progress';
    }
    return 'Scheduled';
  }

  if (statusLower === 'done') return 'Done';

  const p50Start = stat?.p50StartDay ?? 0;
  const p85End = stat?.p85EndDay ?? node.baseEstimateDays;
  const p50End = stat?.p50EndDay ?? node.baseEstimateDays;

  if (scrubberDayOffset >= p85End) {
    return 'Done';
  }
  if (scrubberDayOffset >= p50End && scrubberDayOffset < p85End) {
    if ((stat?.rippleDelayDays ?? 0) > 0 || node.uncertaintySigma >= 1.8 || statusLower === 'blocked') {
      return 'At Risk / Blocked';
    }
    return 'In Progress';
  }
  if (scrubberDayOffset >= p50Start) {
    if (statusLower === 'blocked' || (hasActiveIntervention && (stat?.rippleDelayDays ?? 0) >= 4)) {
      return 'At Risk / Blocked';
    }
    return 'In Progress';
  }
  return 'Scheduled';
}

export interface TimelineScrubberProps {
  graph: CausalGraph;
  activeSim: SimulationResult;
  selectedEpochIndex: number;
  scrubberDayOffset: number;
  hasActiveIntervention: boolean;
}

const HUMAN_EPOCH_LABELS: Record<number, { title: string; badge: string }> = {
  0: { title: 'Sprint -2', badge: '4W AGO' },
  1: { title: 'Sprint -1', badge: '2W AGO' },
  2: { title: 'Today (Current)', badge: 'LIVE' },
  3: { title: 'Likely Finish', badge: '50% ODDS' },
  4: { title: 'Target Commit Date', badge: '85% SAFE' },
  5: { title: 'Safe Buffer Date', badge: '95% CUTOFF' },
};

export function renderTimelineScrubber(props: TimelineScrubberProps): string {
  const {
    graph,
    activeSim,
    selectedEpochIndex,
    scrubberDayOffset,
    hasActiveIntervention,
  } = props;

  const epochs = activeSim.timeMachineEpochs;
  const scrubbedDate = addCalendarDays(graph.referenceDate, scrubberDayOffset);

  let dynamicDone = 0;
  let dynamicInProgress = 0;
  let dynamicAtRisk = 0;
  let dynamicScheduled = 0;

  for (const node of graph.nodes) {
    const stat = activeSim.nodeStats[node.key];
    const tState = evaluateNodeTemporalState(
      node,
      stat,
      scrubberDayOffset,
      hasActiveIntervention
    );
    if (tState === 'Done') dynamicDone++;
    else if (tState === 'In Progress') dynamicInProgress++;
    else if (tState === 'At Risk / Blocked') dynamicAtRisk++;
    else dynamicScheduled++;
  }

  const relativeOffsetLabel =
    scrubberDayOffset === 0
      ? 'Today'
      : scrubberDayOffset > 0
        ? `+${scrubberDayOffset} Days`
        : `${scrubberDayOffset} Days`;

  const maxBucketProb = Math.max(
    0.05,
    ...activeSim.distributionBuckets.map((b) => b.probability)
  );

  const reserves = activeSim.reserves;
  const baseTargetDays = reserves?.baseTargetDays ?? activeSim.p50Days;
  const pmBufferDays = reserves?.pmContingencyReserveDays ?? Math.max(0.5, activeSim.p85Days - activeSim.p50Days);
  const execReserveDays = reserves?.managementReserveDays ?? Math.max(0.5, activeSim.cvar95Days - activeSim.p85Days);
  const totalReserveSpan = Math.max(1, baseTargetDays + pmBufferDays + execReserveDays);
  const basePct = Math.max(20, Math.round((baseTargetDays / totalReserveSpan) * 100));
  const pmPct = Math.max(10, Math.round((pmBufferDays / totalReserveSpan) * 100));
  const execPct = Math.max(8, 100 - basePct - pmPct);

  const buckets = activeSim.distributionBuckets;
  const chartW = 380;
  const chartH = 112;
  const topPad = 18;
  const bottomPad = 20;
  const barAreaH = chartH - topPad - bottomPad; // 74px bar height area
  const colW = Math.floor((chartW - 16) / Math.max(1, buckets.length));

  const svgConeBars = buckets
    .map((b, idx, arr) => {
      const ratio = Math.max(0.08, b.probability / maxBucketProb);
      const barH = Math.max(5, Math.round(ratio * barAreaH));
      const x = 8 + idx * colW + 2;
      const y = topPad + (barAreaH - barH);
      const w = Math.max(8, colW - 5);
      const isNearP85 = Math.abs(b.dayOffset - activeSim.p85Days) <= 2.5;
      const isNearP50 = Math.abs(b.dayOffset - activeSim.p50Days) <= 2.5;
      const isNearScrub = Math.abs(b.dayOffset - scrubberDayOffset) <= 2;

      const fillCol = isNearP85
        ? '#0C66E4'
        : b.dayOffset <= activeSim.p50Days
          ? '#38BDF8'
          : b.dayOffset <= activeSim.p85Days
            ? '#2563EB'
            : '#6366F1';
      const strokeAttr = isNearScrub
        ? 'stroke="#0F172A" stroke-width="2"'
        : isNearP85
          ? 'stroke="#09326C" stroke-width="1.5"'
          : '';

      const pctVal = Math.round(b.probability * 100);
      const cumPctVal = Math.round(b.cumulativeProbability * 100);

      const showTopPct = pctVal >= 8 || isNearP85 || isNearP50;
      const topPctText = showTopPct
        ? `<text x="${x + w / 2}" y="${Math.max(11, y - 4)}" text-anchor="middle" fill="${isNearP85 ? '#0C66E4' : '#334155'}" font-size="8.5" font-weight="${isNearP85 ? '800' : '600'}">${pctVal}%</text>`
        : '';

      const showDateLabel =
        idx === 0 ||
        idx === Math.floor(arr.length * 0.33) ||
        idx === Math.floor(arr.length * 0.66) ||
        idx === arr.length - 1;
      const labelText = showDateLabel
        ? `<text x="${x + w / 2}" y="${chartH - 5}" text-anchor="middle" fill="#475569" font-size="9" font-weight="600">${escapeHtmlText(formatFriendlyDate(b.date))}</text>`
        : '';

      const hoverExplanation = `Finish Window: ${formatFriendlyDate(b.date, true)} | Window Likelihood: ${pctVal}% of the 500 simulated runs finished in this date window | Cumulative Confidence: ${cumPctVal}% chance of finishing on or before ${formatFriendlyDate(b.date)}`;

      return `
        <g class="hist-bar-group">
          <rect x="${x}" y="${y}" width="${w}" height="${barH}" rx="3" fill="${fillCol}" ${strokeAttr}>
            <title>${escapeHtmlText(hoverExplanation)}</title>
          </rect>
          ${topPctText}
          ${labelText}
        </g>
      `;
    })
    .join('');

  const baseP50Tooltip = `Core Work Estimate (${baseTargetDays.toFixed(1)} days, Likely Finish around ${formatFriendlyDate(activeSim.p50Date)}): Typical time needed to finish all planned Jira issues if work proceeds at a normal sprint pace without unexpected blockers (50% odds).`;
  const pmBufferTooltip = `Team Risk Buffer (+${pmBufferDays.toFixed(1)} days, Target Commit Date ${formatFriendlyDate(activeSim.p85Date)}): Extra schedule cushion managed by the Tech Lead / Project Manager for everyday sprint risks (code review wait times, QA bug fixes, minor scope changes). Raises on-time confidence from 50% to 85%.`;
  const execReserveTooltip = `Executive Contingency (+${execReserveDays.toFixed(1)} days, worst-case safe date ${formatFriendlyDate(activeSim.cvar95Date)}): Leadership reserve held for rare, severe disruptions (cross-team blocker cascades, architecture rework, or key-person bottlenecks) to protect the release in the worst 5% of scenarios.`;

  return `
    <section class="time-machine-panel">
      <!-- Top Full-Width Section: Header, 6-Milestone Stepper & Scrubber Slider -->
      <div class="tm-top-full">
        <div class="tm-header">
          <div class="tm-title">
            <span>Timeline &amp; Sprint Forecast Scrubber</span>
            ${renderInfoTooltip(
              'Timeline & Sprint Forecast Scrubber',
              'Click any of the 6 sprint milestones below or drag the timeline slider to preview which Jira issues are expected to be Done, In Progress, or At Risk on that date.',
              `Reference Date: ${graph.referenceDate} | Viewing Offset: ${scrubberDayOffset}d (${scrubbedDate})`
            )}
          </div>

          <div class="tm-header-right">
            <span class="tm-date-pill">
              Viewing: <strong>${formatFriendlyDate(scrubbedDate, true)}</strong>
              <span class="jira-lozenge jira-lozenge-todo">${relativeOffsetLabel}</span>
            </span>
            <div class="tm-status-summary">
              <span class="jira-lozenge jira-lozenge-done">${dynamicDone} DONE</span>
              <span class="jira-lozenge jira-lozenge-inprogress">${dynamicInProgress} IN PROGRESS</span>
              <span class="jira-lozenge ${dynamicAtRisk > 0 ? 'jira-lozenge-danger' : 'jira-lozenge-neutral'}">${dynamicAtRisk} AT RISK</span>
              <span class="jira-lozenge jira-lozenge-todo">${dynamicScheduled} TO DO</span>
            </div>
          </div>
        </div>

        <!-- Full-Width 6-Column Milestone Stepper Row (Zero Overlap) -->
        <div class="epoch-track-grid">
          ${epochs
            .map((ep, idx) => {
              const meta = HUMAN_EPOCH_LABELS[idx] ?? {
                title: ep.label,
                badge: `${ep.dayOffset >= 0 ? `+${ep.dayOffset}d` : `${ep.dayOffset}d`}`,
              };
              const lozClass =
                idx === 2
                  ? 'jira-lozenge-done'
                  : idx >= 3
                    ? 'jira-lozenge-todo'
                    : 'jira-lozenge-neutral';
              return `
                <button
                  class="epoch-node ${idx === selectedEpochIndex ? 'active' : ''}"
                  data-epoch-idx="${idx}"
                  title="${escapeHtmlText(ep.narrative)}"
                >
                  <div class="epoch-node-top-row">
                    <span class="jira-lozenge ${lozClass}">${escapeHtmlText(meta.badge)}</span>
                    <span class="epoch-date-str">${formatFriendlyDate(ep.date)}</span>
                  </div>
                  <span class="epoch-node-label">${escapeHtmlText(meta.title)}</span>
                </button>
              `;
            })
            .join('')}
        </div>

        <!-- Full-Width Scrubber Slider -->
        <div class="tm-slider-wrap">
          <span class="tm-slider-bound">Past (-28d)</span>
          <input
            type="range"
            min="-28"
            max="${Math.max(35, Math.ceil(activeSim.p95Days) + 6)}"
            value="${scrubberDayOffset}"
            class="tm-slider"
            id="time-machine-range"
            title="Drag to scrub across past sprints and future completion dates"
          />
          <span class="tm-slider-bound">Buffer (${formatFriendlyDate(activeSim.p95Date)})</span>
        </div>
      </div>

      <!-- Bottom 2-Column Split: Left = 3-Tier Schedule Buffer Breakdown | Right = Delivery Confidence Distribution -->
      <div class="tm-bottom-split-2col">
        <!-- Left Card: 3-Tier Schedule Buffer Breakdown -->
        <div class="buffer-breakdown-card">
          <div class="buffer-breakdown-header">
            <div class="buffer-breakdown-title">
              <span>3-Tier Schedule Buffer Breakdown</span>
              ${renderInfoTooltip(
                'What are Core Work Estimate, Team Risk Buffer, and Executive Contingency?',
                '• Core Work Estimate (Likely Finish — 50% odds): Typical time to finish planned work if there are no major surprises (statistical 50th percentile). • Team Risk Buffer (Target Commit Date — 85% safe): Extra days managed by the Tech Lead / PM for normal engineering risks (code review delays, bug fixes, minor scope changes) to reach a safe commitment date (85th percentile). • Executive Contingency (Safe Buffer Date — 95%+ cutoff): Leadership reserve held for rare, severe disruptions (cross-team blocker cascades or architecture rework) in the worst 5% of scenarios.',
                `Core Work Estimate = ${baseTargetDays.toFixed(1)}d (${formatFriendlyDate(activeSim.p50Date)}) | Team Risk Buffer = +${pmBufferDays.toFixed(1)}d (${formatFriendlyDate(activeSim.p85Date)}) | Executive Contingency = +${execReserveDays.toFixed(1)}d (${formatFriendlyDate(activeSim.cvar95Date)})`
              )}
            </div>
            <span class="buffer-total-label">Total Horizon: <strong>${Math.round(totalReserveSpan)}d</strong></span>
          </div>

          <svg width="100%" height="10" class="reserve-svg-bar">
            <rect x="0%" y="0" width="${basePct}%" height="10" fill="#0C66E4">
              <title>${escapeHtmlText(baseP50Tooltip)}</title>
            </rect>
            <rect x="${basePct}%" y="0" width="${pmPct}%" height="10" fill="#E2B203">
              <title>${escapeHtmlText(pmBufferTooltip)}</title>
            </rect>
            <rect x="${basePct + pmPct}%" y="0" width="${execPct}%" height="10" fill="#6E5DC6">
              <title>${escapeHtmlText(execReserveTooltip)}</title>
            </rect>
          </svg>

          <div class="buffer-pills-grid">
            <div class="buffer-pill-item" title="${escapeHtmlText(baseP50Tooltip)}">
              <div class="buffer-pill-top">
                <span class="reserve-dot dot-blue"></span>
                <strong>Core Work Estimate (${Math.round(baseTargetDays)}d)</strong>
              </div>
              <span class="buffer-pill-desc">Likely Finish (${formatFriendlyDate(activeSim.p50Date)})</span>
            </div>

            <div class="buffer-pill-item" title="${escapeHtmlText(pmBufferTooltip)}">
              <div class="buffer-pill-top">
                <span class="reserve-dot dot-amber"></span>
                <strong>Team Risk Buffer (+${Math.round(pmBufferDays)}d)</strong>
              </div>
              <span class="buffer-pill-desc">Target Commit (${formatFriendlyDate(activeSim.p85Date)})</span>
            </div>

            <div class="buffer-pill-item" title="${escapeHtmlText(execReserveTooltip)}">
              <div class="buffer-pill-top">
                <span class="reserve-dot dot-purple"></span>
                <strong>Executive Contingency (+${Math.round(execReserveDays)}d)</strong>
              </div>
              <span class="buffer-pill-desc">Safe Buffer (${formatFriendlyDate(activeSim.cvar95Date)})</span>
            </div>
          </div>
        </div>

        <!-- Right Card: Large, High-Clarity Delivery Confidence Distribution Histogram -->
        <div class="cone-box-wrap">
          <div class="cone-box-header">
            <div class="cone-box-title">
              <span>Delivery Confidence Distribution</span>
              ${renderInfoTooltip(
                'What is Delivery Confidence Distribution?',
                'Shows when your project is most likely to finish across 500 Monte Carlo simulations. • Bar Height (Window Likelihood): The % of the 500 simulated runs that finished during that specific date window (taller bars = most likely finish dates). • Cumulative Confidence: The total probability of finishing ON OR BEFORE that date (e.g., Target Commit Date on ' +
                  formatFriendlyDate(activeSim.p85Date) +
                  ' has 85% confidence).',
                `Likely Finish (50% odds): ${formatFriendlyDate(activeSim.p50Date)} | Target Commit Date (85% safe): ${formatFriendlyDate(activeSim.p85Date)} | Safe Buffer Date (95% cutoff): ${formatFriendlyDate(activeSim.p95Date)}`
              )}
            </div>
            <span class="jira-lozenge jira-lozenge-todo">TARGET: ${escapeHtmlText(formatFriendlyDate(activeSim.p85Date))}</span>
          </div>

          <div class="cone-box-subtitle">
            Bar height = % of 500 simulations finishing in each date window · Hover bars for cumulative on-time confidence
          </div>

          <svg viewBox="0 0 ${chartW} ${chartH}" width="100%" height="${chartH}" class="cone-svg-chart">
            <line x1="8" y1="${topPad}" x2="${chartW - 8}" y2="${topPad}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3 3" />
            <line x1="8" y1="${topPad + Math.round(barAreaH / 2)}" x2="${chartW - 8}" y2="${topPad + Math.round(barAreaH / 2)}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3 3" />
            <line x1="8" y1="${topPad + barAreaH}" x2="${chartW - 8}" y2="${topPad + barAreaH}" stroke="#CBD5E1" stroke-width="1.2" />
            ${svgConeBars}
          </svg>

          <div class="cone-legend-footer">
            <span><i class="reserve-dot dot-sky"></i>Likely Finish (${formatFriendlyDate(activeSim.p50Date)})</span>
            <span><i class="reserve-dot dot-blue"></i>Target Commit Date (${formatFriendlyDate(activeSim.p85Date)})</span>
            <span><i class="reserve-dot dot-indigo"></i>Safe Buffer Date (${formatFriendlyDate(activeSim.p95Date)})</span>
          </div>
        </div>
      </div>
    </section>
  `;
}
