/**
 * Step 4 Component 2: Interactive Causal DAG Canvas (`static/ui/src/components/DagCanvas.tsx`)
 *
 * - Renders an interactive left-to-right Directed Acyclic Graph (SVG + HTML overlay) grouped by Team / Stage.
 * - Color-codes nodes:
 *   1. Critical Path Nodes: Highlighted with an amber/crimson border.
 *   2. Selected / Intervened Node: Glowing cyan/blue indicator (`do(Delay = +X days)`).
 *   3. Downstream Blast Radius Nodes: Pulsing orange/red badge showing exact propagated delay (`+X.X days`).
 * - Dynamically reflects node temporal status when the Time Machine Scrubber is dragged across Past/Today/Future dates.
 */

import { CausalGraph, SimulationResult } from '../../../../src/engine/types';
import { evaluateNodeTemporalState } from './TimelineScrubber';

export interface DagCanvasProps {
  graph: CausalGraph;
  activeSim: SimulationResult;
  selectedNodeKey: string;
  delayDays: number;
  addDeveloper: boolean;
  decoupleBlockingEdges: boolean;
  scrubberDayOffset: number;
}

function escapeHtmlDag(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function computeNodeCoordinates(
  graph: CausalGraph
): Record<string, { x: number; y: number; laneIndex: number; colIndex: number }> {
  const coords: Record<string, { x: number; y: number; laneIndex: number; colIndex: number }> =
    {};

  const teamOrder = graph.teams.map((t) => t.name);
  const laneGroups = new Map<number, string[]>();
  for (let l = 0; l < Math.max(3, teamOrder.length); l++) {
    laneGroups.set(l, []);
  }

  for (const key of graph.topologicalOrder) {
    const node = graph.nodes.find((n) => n.key === key);
    if (!node) continue;
    let laneIdx = teamOrder.indexOf(node.team);
    if (laneIdx < 0) laneIdx = 0;
    laneGroups.get(laneIdx)!.push(key);
  }

  const laneYCenters = [105, 295, 485];
  const xStart = 88;
  const xGap = 148;

  for (const [laneIdx, keys] of laneGroups.entries()) {
    keys.forEach((key, colIdx) => {
      const yBase = laneYCenters[laneIdx % laneYCenters.length];
      const yOffset = colIdx % 2 === 0 ? -12 : 12;
      coords[key] = {
        x: xStart + colIdx * xGap,
        y: yBase + yOffset,
        laneIndex: laneIdx,
        colIndex: colIdx,
      };
    });
  }

  return coords;
}

export function renderDagCanvas(props: DagCanvasProps): string {
  const {
    graph,
    activeSim,
    selectedNodeKey,
    delayDays,
    addDeveloper,
    decoupleBlockingEdges,
    scrubberDayOffset,
  } = props;

  const coords = computeNodeCoordinates(graph);
  const blastSet = new Set(activeSim.blastRadiusNodes);
  const criticalSet = new Set(activeSim.criticalPathNodes);
  const hasActiveIntervention =
    delayDays !== 0 || addDeveloper || decoupleBlockingEdges;
  const intervenedKey = hasActiveIntervention ? selectedNodeKey : '';

  const nodeW = 122;
  const nodeH = 58;

  // Swimlane background bands
  const laneBands = graph.teams
    .map((team, idx) => {
      const yTop = idx * 190 + 18;
      return `
        <g>
          <rect x="12" y="${yTop}" width="965" height="174" rx="10"
            fill="rgba(15, 23, 42, 0.45)" stroke="rgba(148, 163, 184, 0.12)" />
          <rect x="12" y="${yTop}" width="5" height="174" rx="2.5" fill="${team.color}" />
          <text x="26" y="${yTop + 20}" fill="${team.color}" font-size="11" font-weight="700" letter-spacing="0.05em">
            TEAM SWIMLANE ${idx + 1}: ${escapeHtmlDag(team.name.toUpperCase())} (Lead: ${escapeHtmlDag(team.lead)})
          </text>
        </g>
      `;
    })
    .join('');

  // Render directed causal edges
  const edgePaths = graph.edges
    .map((edge) => {
      const fromPos = coords[edge.from];
      const toPos = coords[edge.to];
      if (!fromPos || !toPos) return '';

      const x1 = fromPos.x + nodeW / 2;
      const y1 = fromPos.y;
      const x2 = toPos.x - nodeW / 2;
      const y2 = toPos.y;

      const dx = Math.max(40, Math.abs(x2 - x1) * 0.48);
      const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

      const isDecoupledEdge = decoupleBlockingEdges && edge.from === selectedNodeKey;
      const isBlastEdge =
        intervenedKey !== '' &&
        !isDecoupledEdge &&
        (edge.from === intervenedKey || blastSet.has(edge.from)) &&
        blastSet.has(edge.to);

      const isCriticalEdge =
        criticalSet.has(edge.from) && criticalSet.has(edge.to);

      let edgeClass = 'dag-edge';
      let markerId = 'url(#arrow-default)';
      if (isDecoupledEdge) {
        edgeClass += ' decoupled-edge';
      } else if (isBlastEdge) {
        edgeClass += ' blast-edge';
        markerId = 'url(#arrow-blast)';
      } else if (isCriticalEdge) {
        edgeClass += ' critical-edge';
        markerId = 'url(#arrow-critical)';
      }

      return `<path d="${pathD}" class="${edgeClass}" marker-end="${markerId}" />`;
    })
    .join('');

  // Render nodes
  const nodeElements = graph.nodes
    .map((node) => {
      const pos = coords[node.key];
      if (!pos) return '';

      const stat = activeSim.nodeStats[node.key];
      const isSelected = node.key === selectedNodeKey;
      const isIntervenedOrigin = intervenedKey === node.key;
      const isInBlast = hasActiveIntervention && blastSet.has(node.key);
      const isCritical = criticalSet.has(node.key);

      const temporalState = evaluateNodeTemporalState(
        node,
        stat,
        scrubberDayOffset,
        hasActiveIntervention
      );

      let groupClass = 'dag-node-group';
      if (isCritical) groupClass += ' critical-node';
      if (isInBlast) groupClass += ' in-blast-radius';
      if (isSelected) groupClass += ' selected';
      if (isIntervenedOrigin) groupClass += ' intervened-origin';

      const xLeft = pos.x - nodeW / 2;
      const yTop = pos.y - nodeH / 2;

      let statusColor = '#64748b';
      if (temporalState === 'Done') statusColor = '#10b981';
      else if (temporalState === 'At Risk / Blocked') statusColor = '#f43f5e';
      else if (temporalState === 'In Progress') statusColor = '#38bdf8';

      const rippleShift = stat?.rippleDelayDays ?? 0;

      // Badge on top-right of node
      let topBadge = '';
      if (isSelected && hasActiveIntervention) {
        const labelText =
          delayDays > 0
            ? `do(Delay=+${delayDays}d)`
            : delayDays < 0
              ? `do(Accel=${delayDays}d)`
              : addDeveloper
                ? 'do(+1 Dev)'
                : 'do(Decouple)';
        topBadge = `
          <g transform="translate(${xLeft + nodeW - 76}, ${yTop - 11})">
            <rect width="78" height="17" rx="4" fill="#0284c7" stroke="#38bdf8" stroke-width="1" />
            <text x="39" y="12" text-anchor="middle" fill="#fff" font-size="8.8" font-weight="800" font-family="monospace">
              ${escapeHtmlDag(labelText)}
            </text>
          </g>
        `;
      } else if (isInBlast && Math.abs(rippleShift) > 0) {
        const signText =
          rippleShift > 0 ? `+${rippleShift.toFixed(1)}d` : `${rippleShift.toFixed(1)}d`;
        const fillCol = rippleShift > 0 ? '#9f1239' : '#065f46';
        const strokeCol = rippleShift > 0 ? '#fb7185' : '#34d399';
        topBadge = `
          <g transform="translate(${xLeft + nodeW - 48}, ${yTop - 10})">
            <rect width="48" height="17" rx="4" fill="${fillCol}" stroke="${strokeCol}" stroke-width="1" />
            <text x="24" y="12" text-anchor="middle" fill="#fff" font-size="9.2" font-weight="700" font-family="monospace">
              ${signText}
            </text>
          </g>
        `;
      } else if (isCritical) {
        topBadge = `
          <g transform="translate(${xLeft + nodeW - 40}, ${yTop - 9})">
            <rect width="40" height="15" rx="3" fill="rgba(245, 158, 11, 0.25)" stroke="#f59e0b" stroke-width="0.9" />
            <text x="20" y="10.5" text-anchor="middle" fill="#fcd34d" font-size="8.5" font-weight="700" font-family="monospace">
              CRIT
            </text>
          </g>
        `;
      }

      const shortSummary =
        node.summary.length > 21 ? `${node.summary.slice(0, 20)}…` : node.summary;

      return `
        <g class="${groupClass}" data-node-key="${escapeHtmlDag(node.key)}">
          <rect x="${xLeft}" y="${yTop}" width="${nodeW}" height="${nodeH}" class="dag-node-rect" />
          <circle cx="${xLeft + 11}" cy="${yTop + 14}" r="4.5" fill="${statusColor}" />
          <text x="${xLeft + 20}" y="${yTop + 17}" fill="#f8fafc" font-size="10.5" font-weight="700" font-family="monospace">
            ${escapeHtmlDag(node.key)}
          </text>
          <text x="${xLeft + 9}" y="${yTop + 33}" fill="#cbd5e1" font-size="10">
            ${escapeHtmlDag(shortSummary)}
          </text>
          <text x="${xLeft + 9}" y="${yTop + 48}" fill="#94a3b8" font-size="8.8" font-family="monospace">
            ${escapeHtmlDag(temporalState.split(' ')[0])} · ${node.baseEstimateDays}d±${node.uncertaintySigma}
          </text>
          ${topBadge}
        </g>
      `;
    })
    .join('');

  return `
    <div class="panel-card">
      <div class="panel-header">
        <div class="panel-title">
          🕸️ Interactive Causal DAG Canvas — Grouped by Team &amp; Topological Stage
        </div>
        <div class="dag-legend">
          <span class="legend-item"><span class="legend-dot" style="background:#38bdf8;"></span>Selected / Intervened</span>
          <span class="legend-item"><span class="legend-dot" style="background:#f59e0b;"></span>Critical Path</span>
          <span class="legend-item"><span class="legend-dot" style="background:#f43f5e;"></span>Blast Radius (+Δd)</span>
          <span class="legend-item"><span class="legend-dot" style="background:#10b981;"></span>Done at Scrub Date</span>
        </div>
      </div>
      <div class="dag-viewport">
        <svg viewBox="0 0 990 580" class="dag-svg" id="pwm-dag-svg">
          <defs>
            <marker id="arrow-default" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="rgba(148, 163, 184, 0.55)" />
            </marker>
            <marker id="arrow-critical" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="#f59e0b" />
            </marker>
            <marker id="arrow-blast" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="#f43f5e" />
            </marker>
          </defs>
          ${laneBands}
          ${edgePaths}
          ${nodeElements}
        </svg>
      </div>
    </div>
  `;
}

