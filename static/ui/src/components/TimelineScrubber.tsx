/**
 * Step 4 Component 3: Time Machine Scrubber (`static/ui/src/components/TimelineScrubber.tsx`)
 *
 * - Horizontal timeline slider spanning Past Sprints -> Today (State t₀) -> Future Probability Cones (P50, P85, P95).
 * - Dragging the scrubber forward in time dynamically highlights which nodes are expected to be
 *   Done, In Progress, or At Risk / Blocked on that specific future date.
 */

import { addCalendarDays } from '../../../../src/engine/dag';
import {
  CausalGraph,
  CausalNode,
  NodeSimulationStats,
  SimulationResult,
} from '../../../../src/engine/types';

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

  // Future Probability Cone (t > 0)
  if (statusLower === 'done') return 'Done';

  const p50Start = stat?.p50StartDay ?? 0;
  const p85End = stat?.p85EndDay ?? node.baseEstimateDays;
  const p50End = stat?.p50EndDay ?? node.baseEstimateDays;

  if (scrubberDayOffset >= p85End) {
    return 'Done';
  }
  if (scrubberDayOffset >= p50End && scrubberDayOffset < p85End) {
    // Between P50 and P85 completion window — tail risk / at risk if high sigma or shifted
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

function escapeHtmlScrubber(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderTimelineScrubber(props: TimelineScrubberProps): string {
  const {
    graph,
    activeSim,
    selectedEpochIndex,
    scrubberDayOffset,
    hasActiveIntervention,
  } = props;

  const epochs = activeSim.timeMachineEpochs;
  const currentEpoch = epochs[selectedEpochIndex] ?? epochs[2];
  const scrubbedDate = addCalendarDays(graph.referenceDate, scrubberDayOffset);

  // Dynamically tally node states at the exact `scrubberDayOffset`
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

  const maxBucketProb = Math.max(
    0.05,
    ...activeSim.distributionBuckets.map((b) => b.probability)
  );

  return `
    <section class="time-machine-panel">
      <div class="tm-header">
        <div class="tm-title">
          ⏱️ Time Machine Scrubber — Past Sprints → Today (State t₀) → Future Probability Cones (P50 / P85 / P95)
        </div>
        <div style="font-size:11.5px;font-family:var(--font-mono);color:#67e8f9;">
          Scrubbed Date: <strong>${escapeHtmlScrubber(scrubbedDate)}</strong>
          (${scrubberDayOffset >= 0 ? `t₀ + ${scrubberDayOffset}d` : `t₀ ${scrubberDayOffset}d`}) ·
          Epoch: <strong>${escapeHtmlScrubber(currentEpoch.label)}</strong>
        </div>
      </div>

      <div class="epoch-track">
        ${epochs
          .map(
            (ep, idx) => `
            <button class="epoch-node ${idx === selectedEpochIndex ? 'active' : ''}" data-epoch-idx="${idx}">
              <div class="epoch-node-top">
                <span>${ep.dayOffset >= 0 ? `t₀+${ep.dayOffset}d` : `t₀${ep.dayOffset}d`}</span>
                <span>${escapeHtmlScrubber(ep.date)}</span>
              </div>
              <div class="epoch-node-label">${escapeHtmlScrubber(ep.label)}</div>
            </button>
          `
          )
          .join('')}
      </div>

      <div class="tm-scrubber-row">
        <div class="tm-narrative-box">
          <div class="tm-slider-wrap">
            <span style="font-size:11px;font-family:var(--font-mono);color:var(--text-muted);">Past (-28d)</span>
            <input
              type="range"
              min="-28"
              max="${Math.max(56, Math.ceil(activeSim.p95Days) + 6)}"
              value="${scrubberDayOffset}"
              class="tm-slider"
              id="time-machine-range"
            />
            <span style="font-size:11px;font-family:var(--font-mono);color:var(--text-muted);">P95 (+${Math.ceil(activeSim.p95Days)}d)</span>
          </div>
          <div style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span><strong>State on ${escapeHtmlScrubber(scrubbedDate)}:</strong></span>
            <span class="badge-pill emerald">Done: ${dynamicDone}</span>
            <span class="badge-pill cyan">In Progress: ${dynamicInProgress}</span>
            <span class="badge-pill rose">At Risk / Blocked: ${dynamicAtRisk}</span>
            <span class="badge-pill">Scheduled: ${dynamicScheduled}</span>
            <span style="color:var(--text-muted);">— ${escapeHtmlScrubber(currentEpoch.narrative)}</span>
          </div>
        </div>

        <div>
          <div style="font-size:10.5px;color:var(--text-secondary);margin-bottom:4px;display:flex;justify-content:space-between;">
            <span>Future Probability Cone (500 Worlds)</span>
            <span style="font-family:var(--font-mono);color:#fcd34d;">P85: ${escapeHtmlScrubber(activeSim.p85Date)}</span>
          </div>
          <div class="cone-mini-chart">
            ${activeSim.distributionBuckets
              .map((b) => {
                const heightPct = Math.max(8, Math.round((b.probability / maxBucketProb) * 100));
                const isNearP85 = Math.abs(b.dayOffset - activeSim.p85Days) <= 3;
                const isNearScrub = Math.abs(b.dayOffset - scrubberDayOffset) <= 2;
                return `
                  <div class="cone-bar-col" title="${b.date} (+${b.dayOffset}d): ${Math.round(b.probability * 100)}% density | CDF: ${Math.round(b.cumulativeProbability * 100)}%">
                    <div class="cone-bar ${isNearP85 ? 'p85-marker' : ''} ${isNearScrub ? 'scrub-marker' : ''}" style="height:${heightPct}%;"></div>
                    <span class="cone-bar-label">+${b.dayOffset}d</span>
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

