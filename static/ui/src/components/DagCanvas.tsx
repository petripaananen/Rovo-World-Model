/**
 * Step 4 Component 2: Interactive Dependency Graph Canvas (`static/ui/src/components/DagCanvas.tsx`)
 *
 * Designed for instant visual comprehension:
 * - Spacious 164x66px cards aligned cleanly across 3 team swimlanes.
 * - Zero raw math or Greek symbols on the cards:
 *   Line 1: Issue Key (`CHRON-104`) + Top Impact Badge (`+8d Delay`, `+7.7d`, or `Blocker`)
 *   Line 2: Readable Task Title
 *   Line 3: Clean Status Dot + Status Name (`In Progress`, `Done`, `At Risk`) + Estimate (`7d est.`)
 * - Strong Edge Hierarchy:
 *   Background edges are subtle; Active Downstream Impact path glows with animated crimson arrows.
 * - Rich Floating Hover Inspector Card:
 *   Hovering over any task displays full task summary, assignee, linked Teamwork Graph Goal,
 *   Confluence ADR, and statistical metrics (Uncertainty ±σ, Criticality %, Ripple Weight).
 */

import { CausalGraph, SimulationResult } from '../../../../src/engine/types';
import { evaluateNodeTemporalState } from './TimelineScrubber';
import {
  escapeHtmlText,
  formatFriendlyDate,
  renderInfoTooltip,
} from './tooltip';

export interface DagCanvasProps {
  graph: CausalGraph;
  activeSim: SimulationResult;
  selectedNodeKey: string;
  delayDays: number;
  addDeveloper: boolean;
  decoupleBlockingEdges: boolean;
  scrubberDayOffset: number;
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

  const laneYCenters = [115, 315, 515];
  const xStart = 112;
  const xGap = 186;

  for (const [laneIdx, keys] of laneGroups.entries()) {
    keys.forEach((key, colIdx) => {
      const yBase = laneYCenters[laneIdx % laneYCenters.length];
      // Subtle vertical stagger so horizontal edges never collide with intermediate text
      const yOffset = colIdx % 2 === 0 ? -8 : 8;
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

  const nodeW = 160;
  const nodeH = 66;

  // Swimlane background bands
  const laneBands = graph.teams
    .map((team, idx) => {
      const yTop = idx * 200 + 18;
      return `
        <g>
          <rect x="14" y="${yTop}" width="1152" height="184" rx="12"
            fill="rgba(15, 23, 42, 0.52)" stroke="rgba(148, 163, 184, 0.13)" />
          <rect x="14" y="${yTop}" width="6" height="184" rx="3" fill="${team.color}" />
          <text x="32" y="${yTop + 24}" fill="${team.color}" font-size="11.5" font-weight="700" letter-spacing="0.04em">
            ${escapeHtmlText(team.name.toUpperCase())} TEAM · Lead: ${escapeHtmlText(team.lead)}
          </text>
        </g>
      `;
    })
    .join('');

  // Render directed dependency edges
  const edgePaths = graph.edges
    .map((edge) => {
      const fromPos = coords[edge.from];
      const toPos = coords[edge.to];
      if (!fromPos || !toPos) return '';

      const x1 = fromPos.x + nodeW / 2;
      const y1 = fromPos.y;
      const x2 = toPos.x - nodeW / 2;
      const y2 = toPos.y;

      const dx = Math.max(46, Math.abs(x2 - x1) * 0.46);
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

      const edgeTooltip = `${edge.from} ${edge.dependencyType} ${edge.to} (Propagation weight: ${Math.round(edge.propagationWeight * 100)}%)`;

      return `<path d="${pathD}" class="${edgeClass}" marker-end="${markerId}"><title>${escapeHtmlText(edgeTooltip)}</title></path>`;
    })
    .join('');

  // Render spacious, easy-to-read task cards
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
      let statusShort = 'Scheduled';
      if (temporalState === 'Done') {
        statusColor = '#10b981';
        statusShort = 'Done';
      } else if (temporalState === 'At Risk / Blocked') {
        statusColor = '#f43f5e';
        statusShort = 'At Risk';
      } else if (temporalState === 'In Progress') {
        statusColor = '#38bdf8';
        statusShort = 'In Progress';
      }

      const rippleShift = stat?.rippleDelayDays ?? 0;
      const goalObj = graph.goals.find((g) => g.id === node.goalId);

      // Human-friendly badge on top-right of card (Zero `do(...)` notation)
      let topBadge = '';
      if (isSelected && hasActiveIntervention) {
        const labelText =
          delayDays > 0
            ? `+${delayDays}d Delay`
            : delayDays < 0
              ? `${delayDays}d Faster`
              : addDeveloper
                ? '+1 Dev Added'
                : 'Decoupled';
        topBadge = `
          <g transform="translate(${xLeft + nodeW - 76}, ${yTop - 11})">
            <rect width="78" height="19" rx="5" fill="#0284c7" stroke="#7dd3fc" stroke-width="1.2" />
            <text x="39" y="13" text-anchor="middle" fill="#fff" font-size="9.5" font-weight="700" font-family="Inter, sans-serif">
              ${escapeHtmlText(labelText)}
            </text>
          </g>
        `;
      } else if (isInBlast && Math.abs(rippleShift) > 0) {
        const signText =
          rippleShift > 0 ? `+${rippleShift.toFixed(1)}d Slip` : `${rippleShift.toFixed(1)}d`;
        const fillCol = rippleShift > 0 ? '#be123c' : '#047857';
        const strokeCol = rippleShift > 0 ? '#fda4af' : '#6ee7b7';
        topBadge = `
          <g transform="translate(${xLeft + nodeW - 64}, ${yTop - 11})">
            <rect width="66" height="19" rx="5" fill="${fillCol}" stroke="${strokeCol}" stroke-width="1.1" />
            <text x="33" y="13" text-anchor="middle" fill="#fff" font-size="9.5" font-weight="700" font-family="Inter, sans-serif">
              ${signText}
            </text>
          </g>
        `;
      } else if (isCritical) {
        topBadge = `
          <g transform="translate(${xLeft + nodeW - 56}, ${yTop - 10})">
            <rect width="56" height="17" rx="4" fill="rgba(245, 158, 11, 0.25)" stroke="#fbbf24" stroke-width="1" />
            <text x="28" y="12" text-anchor="middle" fill="#fde68a" font-size="9" font-weight="700" font-family="Inter, sans-serif">
              Blocker
            </text>
          </g>
        `;
      }

      const shortSummary =
        node.summary.length > 26 ? `${node.summary.slice(0, 25)}…` : node.summary;

      const hoverJson = JSON.stringify({
        key: node.key,
        summary: node.summary,
        team: node.team,
        assignee: node.assignee,
        status: temporalState,
        estimateDays: node.baseEstimateDays,
        sigma: node.uncertaintySigma,
        goalName: goalObj?.name ?? node.goalId,
        p85Date: stat ? formatFriendlyDate(stat.p85CompletionDate, true) : 'N/A',
        rippleShift: rippleShift,
        criticalityPct: Math.round((stat?.criticalityIndex ?? 0) * 100),
        adr: node.confluenceDecision
          ? `${node.confluenceDecision.title} (${node.confluenceDecision.spaceKey})`
          : '',
      });

      return `
        <g
          class="${groupClass}"
          data-node-key="${escapeHtmlText(node.key)}"
          data-node-hover="${escapeHtmlText(hoverJson)}"
        >
          <rect x="${xLeft}" y="${yTop}" width="${nodeW}" height="${nodeH}" class="dag-node-rect" />
          <!-- Line 1: Issue Key -->
          <text x="${xLeft + 12}" y="${yTop + 19}" fill="#f8fafc" font-size="11.5" font-weight="700" font-family="JetBrains Mono, monospace">
            ${escapeHtmlText(node.key)}
          </text>
          <!-- Line 2: Human Task Title -->
          <text x="${xLeft + 12}" y="${yTop + 37}" fill="#e2e8f0" font-size="11" font-weight="500">
            ${escapeHtmlText(shortSummary)}
          </text>
          <!-- Line 3: Clean Status Pill + Duration Estimate (Zero Greek symbols) -->
          <circle cx="${xLeft + 16}" cy="${yTop + 53}" r="4.5" fill="${statusColor}" />
          <text x="${xLeft + 25}" y="${yTop + 56}" fill="#94a3b8" font-size="10" font-weight="600">
            ${escapeHtmlText(statusShort)}
          </text>
          <text x="${xLeft + nodeW - 12}" y="${yTop + 56}" text-anchor="end" fill="#64748b" font-size="10" font-family="JetBrains Mono, monospace">
            ${node.baseEstimateDays}d est.
          </text>
          ${topBadge}
        </g>
      `;
    })
    .join('');

  return `
    <div class="panel-card dag-panel-card">
      <div class="panel-header">
        <div class="panel-title">
          <span>🕸️ Cross-Team Dependency Map — Click Any Task to Simulate Delays</span>
          ${renderInfoTooltip(
            'Directed Acyclic Graph (DAG) & Ripple Propagation',
            'Shows how tasks across Core Engine, Cloud Infra, and Client UI depend on one another. Click any task card to test a What-If delay or resource change, or hover over any card for full technical details.',
            `Kahn Topological Sort (${graph.nodes.length} nodes, ${graph.edges.length} directed edges, ${graph.brokenCycles.length} cycles auto-broken)`
          )}
        </div>
        <div class="dag-legend">
          <span class="legend-item"><span class="legend-dot" style="background:#38bdf8;"></span>Selected Task</span>
          <span class="legend-item"><span class="legend-dot" style="background:#f59e0b;"></span>Critical Blocker</span>
          <span class="legend-item"><span class="legend-dot" style="background:#f43f5e;"></span>Delayed Downstream</span>
          <span class="legend-item"><span class="legend-dot" style="background:#10b981;"></span>Completed</span>
        </div>
      </div>

      <div class="dag-viewport" id="dag-viewport-container">
        <svg viewBox="0 0 1180 620" class="dag-svg" id="pwm-dag-svg">
          <defs>
            <marker id="arrow-default" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="rgba(148, 163, 184, 0.45)" />
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

        <!-- Floating Hover Inspector Card (Populated on Node Mouseover) -->
        <div id="dag-node-hover-card" class="dag-hover-card" style="display:none;"></div>
      </div>
    </div>
  `;
}
