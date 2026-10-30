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
  3: { title: 'Likely Finish', badge: '50% TARGET' },
  4: { title: 'Commit Target', badge: '85% COMMIT' },
  5: { title: 'Buffer Cutoff', badge: '95% SAFE' },
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

  return `
    <section class="time-machine-panel">
      <div class="tm-header">
        <div class="tm-title">
          <span>Timeline &amp; Sprint Forecast Scrubber</span>
          ${renderInfoTooltip(
            'Timeline Scrubber',
            'Select a sprint milestone or drag the timeline slider to preview which issues are expected to be Done, In Progress, or At Risk on any future date.',
            `Reference Date = ${graph.referenceDate} | Selected Offset = ${scrubberDayOffset}d (${scrubbedDate})`
          )}
        </div>
        <div class="tm-date-readout">
          <span class="tm-date-pill">
            Viewing Date: <strong>${formatFriendlyDate(scrubbedDate, true)}</strong>
            <span class="jira-lozenge jira-lozenge-todo">${relativeOffsetLabel}</span>
          </span>
        </div>
      </div>

      <div class="epoch-track">
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
                <div class="epoch-node-top">
                  <span class="jira-lozenge ${lozClass}">${escapeHtmlText(meta.badge)}</span>
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

          <div class="tm-status-summary">
            <span class="tm-status-prefix">Status on <strong>${formatFriendlyDate(scrubbedDate)}</strong>:</span>
            <span class="jira-lozenge jira-lozenge-done">${dynamicDone} DONE</span>
            <span class="jira-lozenge jira-lozenge-inprogress">${dynamicInProgress} IN PROGRESS</span>
            <span class="jira-lozenge ${dynamicAtRisk > 0 ? 'jira-lozenge-danger' : 'jira-lozenge-neutral'}">${dynamicAtRisk} AT RISK</span>
            <span class="jira-lozenge jira-lozenge-todo">${dynamicScheduled} TO DO</span>
          </div>
        </div>

        <div class="cone-box-wrap" title="Hover bars for exact Monte Carlo completion probability and cumulative confidence">
          <div class="cone-box-header">
            <span>Delivery Confidence Distribution</span>
            <strong style="color:#0C66E4;">Target: ${formatFriendlyDate(activeSim.p85Date)}</strong>
          </div>
          <div class="cone-mini-chart">
            ${activeSim.distributionBuckets
              .map((b, idx, arr) => {
                const heightPct = Math.max(10, Math.round((b.probability / maxBucketProb) * 100));
                const isNearP85 = Math.abs(b.dayOffset - activeSim.p85Days) <= 2.5;
                const isNearScrub = Math.abs(b.dayOffset - scrubberDayOffset) <= 2;
                const showDateLabel =
                  idx === 0 || idx === Math.floor(arr.length / 2) || idx === arr.length - 1;
                return `
                  <div
                    class="cone-bar-col"
                    title="${formatFriendlyDate(b.date, true)}: ${Math.round(b.probability * 100)}% density | Confidence: ${Math.round(b.cumulativeProbability * 100)}%"
                  >
                    <div class="cone-bar ${isNearP85 ? 'p85-marker' : ''} ${isNearScrub ? 'scrub-marker' : ''}" style="height:${heightPct}%;"></div>
                    <span class="cone-bar-label">${showDateLabel ? formatFriendlyDate(b.date) : '&nbsp;'}</span>
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
