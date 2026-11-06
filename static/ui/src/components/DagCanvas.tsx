/**
 * Step 4 Component 2: Atlassian Jira-Native Dependency & Timeline Canvas (`static/ui/src/components/DagCanvas.tsx`)
 *
 * Designed via Stitch MCP (`StitchMCP` Project `9764708271730429878`) to match Jira Cloud cards:
 * - Authentic white Jira Issue Cards (`#FFFFFF`, `1px solid #DCDFE4`)
 * - Standard Jira blue checkbox icon (`#0C66E4`) + Issue Key (`BLP-7`) + Rectangular Status Lozenge (`TO DO`, `IN PROGRESS`, `DONE`, `AT RISK`)
 * - Assignee avatar circle (`PP`, `MC`) + clean estimate tag (`5d est.`)
 * - Scales cleanly whether the active Jira project has 2 issues (e.g. BloomPath Sprint `BLP-7`, `BLP-8`) or 18 issues.
 * - Hovering any issue card reveals the floating Jira Inspector Popover with full metadata & math.
 */

import { CausalGraph, SimulationResult } from '../../../../src/engine/types';
import { evaluateNodeTemporalState } from './TimelineScrubber';
import {
  escapeHtmlText,
  formatFriendlyDate,
  getInitials,
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
): {
  coords: Record<string, { x: number; y: number; laneIndex: number; colIndex: number }>;
  activeTeams: Array<{ id: string; name: string; lead: string; color: string }>;
  svgHeight: number;
  svgWidth: number;
} {
  const coords: Record<string, { x: number; y: number; laneIndex: number; colIndex: number }> =
    {};

  // Only render swimlanes that actually contain issues in this project
  const usedTeamNames = Array.from(new Set(graph.nodes.map((n) => n.team)));
  const activeTeams = usedTeamNames.map((tName, idx) => {
    const found = graph.teams.find((t) => t.name === tName);
    const defaultColors = ['#0C66E4', '#1F845A', '#E2B203', '#6E5DC6'];
    return (
      found ?? {
        id: `team-${idx}`,
        name: tName,
        lead: 'Project Team',
        color: defaultColors[idx % defaultColors.length],
      }
    );
  });

  if (activeTeams.length === 0) {
    activeTeams.push({
      id: 'team-0',
      name: `${graph.projectName} Team`,
      lead: 'Project Lead',
      color: '#0C66E4',
    });
  }

  const laneGroups = new Map<number, string[]>();
  for (let l = 0; l < activeTeams.length; l++) {
    laneGroups.set(l, []);
  }

  for (const key of graph.topologicalOrder) {
    const node = graph.nodes.find((n) => n.key === key);
    if (!node) continue;
    let laneIdx = activeTeams.findIndex((t) => t.name === node.team);
    if (laneIdx < 0) laneIdx = 0;
    laneGroups.get(laneIdx)!.push(key);
  }

  const laneHeight = 190;
  const xStart = 128;
  const xGap = 224;
  let maxCols = 1;

  for (const [laneIdx, keys] of laneGroups.entries()) {
    if (keys.length > maxCols) maxCols = keys.length;
    const yBase = laneIdx * laneHeight + 112;
    keys.forEach((key, colIdx) => {
      const yOffset = keys.length > 2 ? (colIdx % 2 === 0 ? -6 : 6) : 0;
      coords[key] = {
        x: xStart + colIdx * xGap,
        y: yBase + yOffset,
        laneIndex: laneIdx,
        colIndex: colIdx,
      };
    });
  }

  const svgHeight = Math.max(240, activeTeams.length * laneHeight + 28);
  const svgWidth = Math.max(820, xStart + maxCols * xGap + 60);

  return { coords, activeTeams, svgHeight, svgWidth };
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

  const { coords, activeTeams, svgHeight, svgWidth } = computeNodeCoordinates(graph);
  const blastSet = new Set(activeSim.blastRadiusNodes);
  const criticalSet = new Set(activeSim.criticalPathNodes);
  const hasActiveIntervention =
    delayDays !== 0 || addDeveloper || decoupleBlockingEdges;
  const intervenedKey = hasActiveIntervention ? selectedNodeKey : '';

  const nodeW = 192;
  const nodeH = 82;
  const laneHeight = 190;

  // Swimlane background bands (Atlassian light subtle container)
  const laneBands = activeTeams
    .map((team, idx) => {
      const yTop = idx * laneHeight + 16;
      return `
        <g>
          <rect x="14" y="${yTop}" width="${svgWidth - 28}" height="${laneHeight - 16}" rx="6"
            fill="#F7F8F9" stroke="#DCDFE4" stroke-width="1" />
          <rect x="14" y="${yTop}" width="4" height="${laneHeight - 16}" rx="2" fill="${team.color}" />
          <text x="30" y="${yTop + 22}" fill="#44546F" font-size="11" font-weight="700" letter-spacing="0.04em">
            ${escapeHtmlText(team.name.toUpperCase())}
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

      const dx = Math.max(48, Math.abs(x2 - x1) * 0.45);
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

      const precType = edge.precedenceType ?? 'FS';
      const lagDays = edge.lagDays ?? 0;
      const lagSuffix =
        lagDays > 0
          ? ` (+${lagDays}d Lag)`
          : lagDays < 0
            ? ` (${lagDays}d Fast-Track)`
            : '';
      const edgeTooltip = `${edge.from} ${edge.dependencyType} (${precType}${lagSuffix}) ${edge.to}`;

      const hasNonDefaultMeta = precType !== 'FS' || lagDays !== 0;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const pillLabel =
        lagDays < 0
          ? `${precType} ${lagDays}d FT`
          : lagDays > 0
            ? `${precType} +${lagDays}d`
            : precType;

      const edgeMetaBadge = hasNonDefaultMeta
        ? `<g transform="translate(${midX - 24}, ${midY - 8})">
             <rect width="48" height="15" rx="3" fill="${lagDays < 0 ? '#FFF7D6' : '#F3F0FF'}" stroke="${lagDays < 0 ? '#E2B203' : '#6E5DC6'}" stroke-width="1" />
             <text x="24" y="10.5" text-anchor="middle" fill="${lagDays < 0 ? '#A54800' : '#5E4DB2'}" font-size="8.5" font-weight="700">${escapeHtmlText(pillLabel)}</text>
           </g>`
        : '';

      return `<g><path d="${pathD}" class="${edgeClass}" marker-end="${markerId}"><title>${escapeHtmlText(edgeTooltip)}</title></path>${edgeMetaBadge}</g>`;
    })
    .join('');

  // Render authentic Jira Issue Cards inside SVG
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

      // Jira Status Lozenge colors inside SVG card
      let lozengeBg = '#E9F2FF';
      let lozengeTextCol = '#0055CC';
      let lozengeLabel = 'TO DO';
      if (temporalState === 'Done') {
        lozengeBg = '#DFFCF0';
        lozengeTextCol = '#216E4E';
        lozengeLabel = 'DONE';
      } else if (temporalState === 'At Risk / Blocked') {
        lozengeBg = '#FFECEB';
        lozengeTextCol = '#AE2E24';
        lozengeLabel = 'AT RISK';
      } else if (temporalState === 'In Progress') {
        lozengeBg = '#FFF7D6';
        lozengeTextCol = '#A54800';
        lozengeLabel = 'IN PROGRESS';
      }

      const rippleShift = stat?.rippleDelayDays ?? 0;
      const goalObj = graph.goals.find((g) => g.id === node.goalId);

      // Top-right shift pill if affected by What-If simulation
      let topBadge = '';
      if (isSelected && hasActiveIntervention) {
        const labelText =
          delayDays > 0
            ? `+${delayDays}d Delay`
            : delayDays < 0
              ? `${delayDays}d Faster`
              : addDeveloper
                ? '+1 Dev'
                : 'Decoupled';
        topBadge = `
          <g transform="translate(${xLeft + nodeW - 72}, ${yTop - 10})">
            <rect width="72" height="18" rx="3" fill="#0C66E4" />
            <text x="36" y="12.5" text-anchor="middle" fill="#FFFFFF" font-size="9.5" font-weight="700">
              ${escapeHtmlText(labelText)}
            </text>
          </g>
        `;
      } else if (isInBlast && Math.abs(rippleShift) > 0) {
        const signText =
          rippleShift > 0 ? `+${rippleShift.toFixed(1)}d Slip` : `${rippleShift.toFixed(1)}d`;
        const fillCol = rippleShift > 0 ? '#CA3521' : '#1F845A';
        topBadge = `
          <g transform="translate(${xLeft + nodeW - 64}, ${yTop - 10})">
            <rect width="64" height="18" rx="3" fill="${fillCol}" />
            <text x="32" y="12.5" text-anchor="middle" fill="#FFFFFF" font-size="9.5" font-weight="700">
              ${signText}
            </text>
          </g>
        `;
      } else if (node.isStageGate) {
        topBadge = `
          <g transform="translate(${xLeft + nodeW - 48}, ${yTop - 10})">
            <rect width="48" height="18" rx="3" fill="#6E5DC6" />
            <text x="24" y="12.5" text-anchor="middle" fill="#FFFFFF" font-size="9" font-weight="700">
              GATE
            </text>
          </g>
        `;
      }

      const shortSummary =
        node.summary.length > 27 ? `${node.summary.slice(0, 26)}…` : node.summary;
      const avatarInitials = getInitials(node.assignee);

      const hoverJson = JSON.stringify({
        key: node.key,
        summary: node.summary,
        team: node.team,
        assignee: node.assignee,
        status: temporalState,
        estimateDays: node.baseEstimateDays,
        sigma: node.uncertaintySigma,
        pertMean: stat?.pertMeanDays ?? node.baseEstimateDays,
        pertSigma: stat?.pertSigmaDays ?? node.uncertaintySigma,
        completionStepPct: stat?.completionStepPct ?? 0,
        totalFloatDays: stat?.totalFloatDays ?? 0,
        isStageGate: Boolean(node.isStageGate),
        goalName: goalObj?.name ?? node.goalId,
        p85Date: stat ? formatFriendlyDate(stat.p85Date, true) : 'N/A',
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
          <!-- Jira White Issue Card -->
          <rect x="${xLeft}" y="${yTop}" width="${nodeW}" height="${nodeH}" class="dag-node-rect" />

          <!-- Row 1: Issue Title (just like Jira Board card) -->
          <text x="${xLeft + 12}" y="${yTop + 22}" fill="#172B4D" font-size="11.5" font-weight="600">
            ${escapeHtmlText(shortSummary)}
          </text>

          <!-- Row 2: Rectangular Status Lozenge + Duration Estimate -->
          <rect x="${xLeft + 12}" y="${yTop + 31}" width="${Math.max(46, lozengeLabel.length * 6.5 + 10)}" height="16" rx="3" fill="${lozengeBg}" />
          <text x="${xLeft + 17}" y="${yTop + 42.5}" fill="${lozengeTextCol}" font-size="9.2" font-weight="700" letter-spacing="0.03em">
            ${escapeHtmlText(lozengeLabel)}
          </text>
          <text x="${xLeft + nodeW - 12}" y="${yTop + 42.5}" text-anchor="end" fill="#626F86" font-size="10">
            ${node.baseEstimateDays}d est.
          </text>

          <!-- Row 3: Jira Blue Checkbox Icon + Issue Key (e.g. BLP-7) + Assignee Avatar Circle -->
          <rect x="${xLeft + 12}" y="${yTop + 57}" width="13" height="13" rx="2.5" fill="#0C66E4" />
          <path d="M ${xLeft + 15} ${yTop + 63.5} L ${xLeft + 17.5} ${yTop + 66} L ${xLeft + 22} ${yTop + 60.5}" stroke="#FFFFFF" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          <text x="${xLeft + 30}" y="${yTop + 67.5}" fill="#44546F" font-size="11" font-weight="600">
            ${escapeHtmlText(node.key)}
          </text>

          <!-- Assignee Circular Avatar -->
          <circle cx="${xLeft + nodeW - 20}" cy="${yTop + 63.5}" r="10" fill="#DFE1E6" stroke="#FFFFFF" stroke-width="1" />
          <text x="${xLeft + nodeW - 20}" y="${yTop + 67}" text-anchor="middle" fill="#172B4D" font-size="8.5" font-weight="700">
            ${escapeHtmlText(avatarInitials)}
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
          <span>Issue Dependency Map (${escapeHtmlText(graph.projectName)})</span>
          ${renderInfoTooltip(
            'Interactive Issue Dependency Map',
            'Displays the live issues and dependency links from your selected Jira project. Click any issue card to test a What-If schedule change, or hover over any card for statistical diagnostics.',
            `Topological Order: ${graph.topologicalOrder.join(' -> ')}`
          )}
        </div>
        <div class="dag-legend">
          <span class="legend-item"><span class="legend-dot" style="background:#0C66E4;"></span>Selected Issue</span>
          <span class="legend-item"><span class="legend-dot" style="background:#E2B203;"></span>Critical Path</span>
          <span class="legend-item"><span class="legend-dot" style="background:#CA3521;"></span>Impacted Downstream</span>
          <span class="legend-item"><span class="legend-dot" style="background:#1F845A;"></span>Done</span>
        </div>
      </div>

      <div class="dag-viewport" id="dag-viewport-container">
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="dag-svg" id="pwm-dag-svg" style="height:${svgHeight}px;min-width:${svgWidth}px;">
          <defs>
            <marker id="arrow-default" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="#8590A2" />
            </marker>
            <marker id="arrow-critical" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="#D97706" />
            </marker>
            <marker id="arrow-blast" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="#CA3521" />
            </marker>
          </defs>
          ${laneBands}
          ${edgePaths}
          ${nodeElements}
        </svg>

        <!-- Floating Hover Inspector Card -->
        <div id="dag-node-hover-card" class="dag-hover-card" style="display:none;"></div>
      </div>
    </div>
  `;
}
