/**
 * Step 4 Component 3: Time Machine Scrubber (`static/ui/src/components/TimelineScrubber.tsx`)
 *
 * Human-first Timeline Scrubber:
 * - Clean milestone buttons with human dates (no raw `t₀` notation in primary labels).
 * - Dragging the slider updates the DAG canvas in real time to show which tasks are
 *   Done, In Progress, At Risk, or Scheduled on that exact calendar date.
 * - Sleek Delivery Confidence Bar (with hover tooltip revealing the full 500-run Monte Carlo distribution).
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

/**
 * Evaluates a node's expected state on any scrubbed day offset `t` (-28d to +65d).
 */
export function evaluateNodeTemporalState(
  node: CausalNode,
  stat: NodeSimulationStats | undefined,
  scrubberDayOffset: number,
  hasActiveIntervention: boolean
): TemporalNodeState {
  const statusLower = node.status.toLowerCase();

  // At Present State (t === 0), reflect live status + any active blast-radius risk
  if (scrubberDayOffset === 0) {
    if (statusLower === 'done') return 'Done';
    if (statusLower === 'blocked' || (hasActiveIntervention && (stat?.rippleDelayDays ?? 0) >= 3)) {
      return 'At Risk / Blocked';
    }
    if (statusLower === 'in progress') return 'In Progress';
    return 'Scheduled';
  }

  // Past Sprints (t < 0)
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

  // Future Forecast Window (t > 0)
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
  0: { title: 'Sprint -2 (Kickoff)', badge: '4 Weeks Ago' },
  1: { title: 'Sprint -1 (Integration)', badge: '2 Weeks Ago' },
  2: { title: 'Today (Current Sprint)', badge: 'Live State' },
  3: { title: 'Likely Finish (50%)', badge: 'Median Target' },
  4: { title: 'Commit Target (85%)', badge: 'Recommended' },
  5: { title: 'Worst-Case Buffer (95%)', badge: 'Safe Cutoff' },
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
        ? `In ${scrubberDayOffset} Days`
        : `${Math.abs(scrubberDayOffset)} Days Ago`;

  const maxBucketProb = Math.max(
    0.05,
    ...activeSim.distributionBuckets.map((b) => b.probability)
  );

  return `
    <section class="time-machine-panel">
      <div class="tm-header">
        <div class="tm-title">
          <span>⏱️ Project Time Machine — Scrub Past Sprints to Future Delivery Dates</span>
          ${renderInfoTooltip(
            'Temporal State & Probability Cone Scrubber',
            'Click any milestone or drag the timeline slider to inspect the exact state of every task on that calendar date. Hover over the mini histogram on the right to inspect the 500-world Monte Carlo completion density.',
            `Reference t₀ = ${graph.referenceDate} | Viewing t = ${scrubberDayOffset >= 0 ? `+${scrubberDayOffset}d` : `${scrubberDayOffset}d`} (${scrubbedDate})`
          )}
        </div>
        <div class="tm-date-readout">
          <span class="tm-date-pill">
            📅 Viewing Date: <strong>${formatFriendlyDate(scrubbedDate, true)}</strong>
            <span class="tm-offset-tag">${relativeOffsetLabel}</span>
          </span>
        </div>
      </div>

      <!-- Clean Milestone Buttons -->
      <div class="epoch-track">
        ${epochs
          .map((ep, idx) => {
            const meta = HUMAN_EPOCH_LABELS[idx] ?? {
              title: ep.label,
              badge: `${ep.dayOffset >= 0 ? `+${ep.dayOffset}d` : `${ep.dayOffset}d`}`,
            };
            const isFutureShift = idx >= 3 && ep.dayOffset > 0;
            return `
              <button
                class="epoch-node ${idx === selectedEpochIndex ? 'active' : ''}"
                data-epoch-idx="${idx}"
                title="${escapeHtmlText(ep.narrative)} (Offset: ${ep.dayOffset >= 0 ? `+${ep.dayOffset}d` : `${ep.dayOffset}d`})"
              >
                <div class="epoch-node-top">
                  <span class="epoch-badge-tag ${idx === 2 ? 'today-tag' : isFutureShift ? 'future-tag' : ''}">${escapeHtmlText(meta.badge)}</span>
                  <span class="epoch-date-str">${formatFriendlyDate(ep.date)}</span>
                </div>
                <div class="epoch-node-label">${escapeHtmlText(meta.title)}</div>
              </button>
            `;
          })
          .join('')}
      </div>

      <div class="tm-scrubber-row">
        <div class="tm-narrative-box">
          <div class="tm-slider-wrap">
            <span class="tm-slider-bound">◀ 4 Weeks Ago</span>
            <input
              type="range"
              min="-28"
              max="${Math.max(56, Math.ceil(activeSim.p95Days) + 6)}"
              value="${scrubberDayOffset}"
              class="tm-slider"
              id="time-machine-range"
              title="Drag to scrub across project history and simulated future completion dates"
            />
            <span class="tm-slider-bound">Worst-Case (${formatFriendlyDate(activeSim.p95Date)}) ▶</span>
          </div>

          <div class="tm-status-summary">
            <span class="tm-status-prefix">Project Snapshot on <strong>${formatFriendlyDate(scrubbedDate)}</strong>:</span>
            <span class="badge-pill emerald">✓ ${dynamicDone} Done</span>
            <span class="badge-pill cyan">● ${dynamicInProgress} In Progress</span>
            <span class="badge-pill ${dynamicAtRisk > 0 ? 'rose' : ''}">⚠ ${dynamicAtRisk} At Risk / Blocked</span>
            <span class="badge-pill">⏳ ${dynamicScheduled} Scheduled</span>
          </div>
        </div>

        <!-- Compact Forecast Distribution Preview (Math details on hover) -->
        <div class="cone-box-wrap" title="Hover individual bars to see exact Monte Carlo completion probability and cumulative confidence (CDF)">
          <div class="cone-box-header">
            <span>Release Probability Curve</span>
            <strong style="color:#fcd34d;">85% Target: ${formatFriendlyDate(activeSim.p85Date)}</strong>
          </div>
          <div class="cone-mini-chart">
            ${activeSim.distributionBuckets
              .map((b) => {
                const heightPct = Math.max(10, Math.round((b.probability / maxBucketProb) * 100));
                const isNearP85 = Math.abs(b.dayOffset - activeSim.p85Days) <= 2.5;
                const isNearScrub = Math.abs(b.dayOffset - scrubberDayOffset) <= 2;
                return `
                  <div
                    class="cone-bar-col"
                    title="${formatFriendlyDate(b.date, true)} (+${b.dayOffset}d): ${Math.round(b.probability * 100)}% finish probability | Cumulative Confidence: ${Math.round(b.cumulativeProbability * 100)}%"
                  >
                    <div class="cone-bar ${isNearP85 ? 'p85-marker' : ''} ${isNearScrub ? 'scrub-marker' : ''}" style="height:${heightPct}%;"></div>
                    <span class="cone-bar-label">${formatFriendlyDate(b.date)}</span>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>
      </div>
    </section>
  `;
}
