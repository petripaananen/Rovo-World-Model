/**
 * Step 4 Component 2: Synthesis 1 ("Nordic Split-Command") 4-Shape Pre-Attentive Dependency Canvas
 * (`static/ui/src/components/DagCanvas.tsx`)
 *
 * Implements the approved Synthesis 1 visual architecture:
 * - 3 Nordic Pastel Color-Blocked Squad Swimlanes (Sky-Cobalt, Warm Sand, Soft Lavender)
 *   with vertical squad header tabs on the left edge.
 * - 4-Shape Pre-Attentive Node Taxonomy:
 *   1. ● Circle (`r = 46px`): Standard Jira Task / Story / Epic with outer Sub-task Completion
 *      Progress Ring (`4/6 Sub-tasks · 67%`), Centered Responsible Assignee Avatar (`PP`, `JD`),
 *      and bottom Jira Issue Key Pill (`KAN-1`).
 *   2. ⬢ Hexagon (`R = 50px`): Critical Path Blocker (`KAN-3`) with coral-red/amber hazard
 *      silhouette, segmented progress border, warning badge (`!`), and Assignee Avatar.
 *   3. ◆ Diamond (`R = 50px`): Verification / Architecture Stage Gate (`Gate: SecOps / QA`)
 *      in Royal Violet (`#7C3AED`) with gate badge and lead avatar.
 *   4. 胶囊 Stadium Pill (`152×46px`): Teamwork Graph Goal capsules anchored at the right
 *      terminal edge of the swimlanes (`Sprint Delivery`, `Release Milestone`).
 */

import {
  AssigneeInterventionOverride,
  CausalGraph,
  CausalNode,
  NodeInterventionOverride,
  SimulationResult,
} from '../../../../src/engine/types';
import { evaluateNodeTemporalState } from './TimelineScrubber';
import {
  escapeHtmlText,
  formatFriendlyDate,
  getInitials,
  renderDragHandleBadge,
  renderInfoTooltip,
} from './tooltip';

export interface DagCanvasProps {
  graph: CausalGraph;
  activeSim: SimulationResult;
  selectedNodeKey: string;
  delayDays: number;
  addDeveloper: boolean;
  decoupleBlockingEdges: boolean;
  trimScope: boolean;
  scrubberDayOffset: number;
  simulatorMode?: 'issue' | 'person';
  pinnedNodeOverrides?: Record<string, NodeInterventionOverride>;
  selectedAssignee?: string;
  assigneeOverrides?: Record<string, AssigneeInterventionOverride>;
}

type NodeShapeKind = 'gate' | 'blocker' | 'task';

function resolveNodeShapeKind(
  node: CausalNode,
  topBlockerKey: string,
  topBlockerSet: Set<string>,
  isIntervenedOrigin: boolean,
  delayDays: number
): NodeShapeKind {
  const isDiamondGate =
    Boolean(node.isStageGate) ||
    Boolean(node.confluenceDecision) ||
    node.issueType?.toLowerCase() === 'milestone' ||
    node.issueType?.toLowerCase() === 'gate';
  if (isDiamondGate) return 'gate';

  const isHexagonBlocker =
    node.key === topBlockerKey ||
    topBlockerSet.has(node.key) ||
    node.status.toLowerCase() === 'blocked' ||
    (isIntervenedOrigin && delayDays > 0);
  return isHexagonBlocker ? 'blocker' : 'task';
}

const AVATAR_PALETTE = [
  '#0284C7',
  '#059669',
  '#7C3AED',
  '#D97706',
  '#DB2777',
  '#2563EB',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export function computeNodeCoordinates(
  graph: CausalGraph
): {
  coords: Record<string, { x: number; y: number; laneIndex: number; colIndex: number }>;
  activeTeams: Array<{ id: string; name: string; lead: string; color: string }>;
  svgHeight: number;
  svgWidth: number;
  laneHeight: number;
  nodeW: number;
  nodeH: number;
  goalColX: number;
} {
  const coords: Record<string, { x: number; y: number; laneIndex: number; colIndex: number }> =
    {};

  const defaultColors = ['#0284C7', '#059669', '#7C3AED', '#D97706', '#DB2777', '#2563EB'];
  const usedTeamNames = Array.from(new Set(graph.nodes.map((n) => n.team)));
  const activeTeams = usedTeamNames.map((tName, idx) => {
    const found = graph.teams.find((t) => t.name === tName);
    return (
      found ?? {
        id: `team-${idx}`,
        name: tName,
        lead: 'Project Lead',
        color:
          tName === 'No Team Assigned'
            ? '#64748B'
            : defaultColors[idx % defaultColors.length],
      }
    );
  });

  if (activeTeams.length === 0) {
    activeTeams.push({
      id: 'team-0',
      name: 'No Team Assigned',
      lead: 'Project Lead',
      color: '#64748B',
    });
  }

  const laneGroups = new Map<number, string[]>();
  for (let l = 0; l < activeTeams.length; l++) {
    laneGroups.set(l, []);
  }

  graph.topologicalOrder.forEach((key) => {
    const node = graph.nodes.find((n) => n.key === key);
    if (!node) return;
    let laneIdx = activeTeams.findIndex((t) => t.name === node.team);
    if (laneIdx < 0) {
      laneIdx = 0;
    }
    laneGroups.get(laneIdx)!.push(key);
  });

  const laneCount = activeTeams.length;
  const laneHeight =
    laneCount === 1
      ? 456
      : laneCount === 2
        ? 228
        : 152;
  const svgHeight = laneCount <= 3 ? 472 : laneCount * laneHeight + 16;
  const nodeW = 104;
  const nodeH = 104;

  const xStart = 252;
  const xGap = 188;
  let maxCols = 1;

  if (laneCount === 1) {
    const keys = laneGroups.get(0) ?? [];
    if (keys.length >= 4) {
      const subRowY = [82, 234, 386];
      maxCols = Math.ceil(keys.length / 3);
      keys.forEach((key, idx) => {
        const colIdx = Math.floor(idx / 3);
        const subRow = idx % 3;
        coords[key] = {
          x: xStart + colIdx * xGap,
          y: subRowY[subRow],
          laneIndex: 0,
          colIndex: colIdx,
        };
      });
    } else {
      maxCols = Math.max(1, keys.length);
      keys.forEach((key, colIdx) => {
        coords[key] = {
          x: xStart + colIdx * xGap,
          y: 234,
          laneIndex: 0,
          colIndex: colIdx,
        };
      });
    }
  } else {
    for (const [laneIdx, keys] of laneGroups.entries()) {
      if (keys.length > maxCols) maxCols = keys.length;
      const yTopBand = laneIdx * laneHeight + 6;
      const yBase = yTopBand + Math.round((laneHeight - 8) / 2);
      keys.forEach((key, colIdx) => {
        coords[key] = {
          x: xStart + colIdx * xGap,
          y: yBase,
          laneIndex: laneIdx,
          colIndex: colIdx,
        };
      });
    }
  }

  const lastNodeX = xStart + Math.max(0, maxCols - 1) * xGap;
  const goalColX = lastNodeX + 196;
  const svgWidth = Math.max(880, goalColX + 116);

  return {
    coords,
    activeTeams,
    svgHeight,
    svgWidth,
    laneHeight,
    nodeW,
    nodeH,
    goalColX,
  };
}

export function renderDagCanvas(props: DagCanvasProps): string {
  const {
    graph,
    activeSim,
    selectedNodeKey,
    delayDays,
    addDeveloper,
    decoupleBlockingEdges,
    trimScope,
    scrubberDayOffset,
    simulatorMode = 'issue',
    pinnedNodeOverrides = {},
    selectedAssignee = '',
    assigneeOverrides = {},
  } = props;

  const {
    coords,
    activeTeams,
    svgHeight,
    svgWidth,
    laneHeight,
    goalColX,
  } = computeNodeCoordinates(graph);

  const blastSet = new Set(activeSim.blastRadiusNodes);
  const criticalSet = new Set(activeSim.criticalPathNodes);
  const topBlockerKey = activeSim.topBottlenecks[0]?.key ?? '';
  const topBlockerSet = new Set(
    activeSim.topBottlenecks.slice(0, 3).map((b) => b.key)
  );
  const pinnedKeys = Object.keys(pinnedNodeOverrides);
  const hasAssigneeMods = Object.values(assigneeOverrides).some(
    (a) =>
      Number(a.unavailableDays ?? 0) !== 0 ||
      a.reassignBottleneck ||
      a.serializeParallelWork ||
      a.pairOnTopBlocker
  );
  const hasCurrentNodeIntervention =
    delayDays !== 0 || addDeveloper || decoupleBlockingEdges || trimScope;
  const hasActiveIntervention =
    hasCurrentNodeIntervention || pinnedKeys.length > 0 || hasAssigneeMods;
  const intervenedKey = hasCurrentNodeIntervention ? selectedNodeKey : '';
  const intervenedOriginSet = new Set<string>(pinnedKeys);
  if (intervenedKey) intervenedOriginSet.add(intervenedKey);

  const blockedByMap = new Map<string, string[]>();
  const blocksMap = new Map<string, string[]>();
  for (const edge of graph.edges) {
    const incoming = blockedByMap.get(edge.to) ?? [];
    incoming.push(edge.from);
    blockedByMap.set(edge.to, incoming);

    const outgoing = blocksMap.get(edge.from) ?? [];
    outgoing.push(edge.to);
    blocksMap.set(edge.from, outgoing);
  }

  // Clean Neutral Swimlane Themes with Crisp Borders
  const laneThemes = [
    {
      bandFill: '#FFFFFF',
      bandStroke: '#94A3B8',
      tabFill: '#F1F5F9',
      textFill: '#334155',
    },
    {
      bandFill: '#F8FAFC',
      bandStroke: '#94A3B8',
      tabFill: '#E2E8F0',
      textFill: '#334155',
    },
    {
      bandFill: '#FFFFFF',
      bandStroke: '#94A3B8',
      tabFill: '#F1F5F9',
      textFill: '#334155',
    },
  ];

  const laneBands = activeTeams
    .map((team, idx) => {
      const yTop = idx * laneHeight + 6;
      const bandH = laneHeight - 8;
      const yMid = yTop + Math.round(bandH / 2);
      const theme = laneThemes[idx % laneThemes.length];
      const teamNodes = graph.nodes.filter((n) => n.team === team.name);
      const doneCount = teamNodes.filter((n) => n.status === 'Done').length;
      const activeCount = teamNodes.filter((n) => n.status !== 'Done').length;
      const accentColor = team.color || '#0284C7';

      // Split long team names cleanly into 1 or 2 upright horizontal lines without reordering words
      let nameLine1 = team.name;
      let nameLine2 = '';
      if (team.name.length > 17) {
        const words = team.name.split(/\s+/);
        let acc = '';
        const rest: string[] = [];
        for (const w of words) {
          if (rest.length === 0 && ((acc + ' ' + w).trim().length <= 16 || acc.length === 0)) {
            acc = (acc + ' ' + w).trim();
          } else {
            rest.push(w);
          }
        }
        nameLine1 = acc;
        nameLine2 = rest.join(' ');
        if (nameLine2.length > 18) {
          nameLine2 = `${nameLine2.slice(0, 17)}…`;
        }
      }

      const leadDisplay =
        team.lead.length > 16 ? `${team.lead.slice(0, 15)}…` : team.lead;
      const isUnassignedTeam = team.name === 'No Team Assigned';
      const laneTooltip = isUnassignedTeam
        ? `No Jira Teams are configured in project "${graph.projectName}". All ${teamNodes.length} issues (${doneCount} Done, ${activeCount} Active) are shown in a single unified project swimlane. Assign the Jira 'Team' field or add a 'team:<Name>' label on issues in Jira to split into multiple team swimlanes.`
        : `Team Swimlane: ${team.name} | Lead: ${team.lead} | ${teamNodes.length} Jira issues (${doneCount} Done, ${activeCount} Active).`;

      if (activeTeams.length === 1 && isUnassignedTeam) {
        return `
          <g>
            <title>${escapeHtmlText(laneTooltip)}</title>
            <rect x="10" y="${yTop}" width="${svgWidth - 20}" height="${bandH}" rx="12"
              fill="${theme.bandFill}" stroke="${theme.bandStroke}" stroke-width="1.5" />
            <rect x="10" y="${yTop}" width="168" height="${bandH}" rx="10"
              fill="${theme.tabFill}" stroke="#CBD5E1" stroke-width="1.5" />
            <rect x="10" y="${yTop + 10}" width="4" height="${bandH - 20}" rx="2"
              fill="#64748B" />

            <!-- Crisp horizontal guide lines for the 3-row issue grid inside the unified lane -->
            <line x1="178" y1="158" x2="${svgWidth - 14}" y2="158" stroke="#CBD5E1" stroke-width="1.25" stroke-dasharray="6 6" />
            <line x1="178" y1="310" x2="${svgWidth - 14}" y2="310" stroke="#CBD5E1" stroke-width="1.25" stroke-dasharray="6 6" />

            <circle cx="24" cy="${yMid - 58}" r="3.5" fill="#64748B" />
            <text x="33" y="${yMid - 55}" fill="#64748B" font-size="9.5" font-weight="800" letter-spacing="0.05em">
              JIRA TEAM STATUS
            </text>

            <text x="20" y="${yMid - 32}" fill="#0F172A" font-size="13" font-weight="800">
              No Team Assigned
            </text>
            <text x="20" y="${yMid - 14}" fill="#475569" font-size="10.5" font-weight="600">
              0 teams in ${escapeHtmlText(graph.projectName.length > 14 ? `${graph.projectName.slice(0, 13)}…` : graph.projectName)}
            </text>

            <text x="20" y="${yMid + 7}" fill="#334155" font-size="10.5" font-weight="600">
              Lead: ${escapeHtmlText(leadDisplay)}
            </text>

            <rect x="20" y="${yMid + 18}" width="134" height="22" rx="11"
              fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.25" />
            <text x="87" y="${yMid + 32.5}" text-anchor="middle" fill="#0F172A" font-size="10" font-weight="700">
              ${teamNodes.length} Issues · ${doneCount}/${teamNodes.length} Done
            </text>

            <text x="20" y="${yMid + 58}" fill="#64748B" font-size="9.5" font-weight="600">
              Set Jira Team field or
            </text>
            <text x="20" y="${yMid + 72}" fill="#64748B" font-size="9.5" font-weight="600">
              team: label to split rows
            </text>
          </g>
        `;
      }

      return `
        <g>
          <title>${escapeHtmlText(laneTooltip)}</title>
          <rect x="10" y="${yTop}" width="${svgWidth - 20}" height="${bandH}" rx="12"
            fill="${theme.bandFill}" stroke="${theme.bandStroke}" stroke-width="1.5" />
          <rect x="10" y="${yTop}" width="168" height="${bandH}" rx="10"
            fill="${theme.tabFill}" stroke="#CBD5E1" stroke-width="1.5" />
          <rect x="10" y="${yTop + 8}" width="4" height="${bandH - 16}" rx="2"
            fill="${accentColor}" />

          <circle cx="24" cy="${yMid - 36}" r="3.5" fill="${accentColor}" />
          <text x="33" y="${yMid - 33}" fill="#64748B" font-size="9.5" font-weight="800" letter-spacing="0.05em">
            ${isUnassignedTeam ? 'UNASSIGNED TEAM' : 'TEAM SWIMLANE'}
          </text>

          <text x="20" y="${nameLine2 ? yMid - 15 : yMid - 8}" fill="#0F172A" font-size="12.5" font-weight="800">
            ${escapeHtmlText(nameLine1)}
          </text>
          ${
            nameLine2
              ? `<text x="20" y="${yMid}" fill="#0F172A" font-size="12.5" font-weight="800">${escapeHtmlText(nameLine2)}</text>`
              : ''
          }

          <text x="20" y="${yMid + 18}" fill="#475569" font-size="10.5" font-weight="600">
            Lead: ${escapeHtmlText(leadDisplay)}
          </text>

          <rect x="20" y="${yMid + 26}" width="134" height="20" rx="10"
            fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.25" />
          <text x="87" y="${yMid + 39.5}" text-anchor="middle" fill="#0F172A" font-size="10" font-weight="700">
            ${teamNodes.length} Issues · ${doneCount}/${teamNodes.length} Done
          </text>
        </g>
      `;
    })
    .join('');

  // Render directed dependency edges between 4-Shape nodes
  const edgeRadiusOffset = 48;
  const edgePaths = graph.edges
    .map((edge) => {
      const fromPos = coords[edge.from];
      const toPos = coords[edge.to];
      if (!fromPos || !toPos) return '';

      const sameCol = fromPos.colIndex === toPos.colIndex;
      const bypassMiddleRow = sameCol && Math.abs(toPos.y - fromPos.y) > 200;
      const x1 = bypassMiddleRow
        ? fromPos.x + 44
        : sameCol
          ? fromPos.x
          : fromPos.x + edgeRadiusOffset;
      const y1 = bypassMiddleRow
        ? fromPos.y
        : sameCol
          ? fromPos.y + (toPos.y > fromPos.y ? edgeRadiusOffset : -edgeRadiusOffset)
          : fromPos.y;
      const x2 = bypassMiddleRow
        ? toPos.x + 44
        : sameCol
          ? toPos.x
          : toPos.x - edgeRadiusOffset;
      const y2 = bypassMiddleRow
        ? toPos.y
        : sameCol
          ? toPos.y + (toPos.y > fromPos.y ? -edgeRadiusOffset : edgeRadiusOffset)
          : toPos.y;

      const dx = Math.max(40, Math.abs(x2 - x1) * 0.45);
      const pathD = bypassMiddleRow
        ? `M ${x1} ${y1} C ${fromPos.x + 86} ${y1}, ${toPos.x + 86} ${y2}, ${x2} ${y2}`
        : sameCol
          ? `M ${x1} ${y1} L ${x2} ${y2}`
          : `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

      const isDecoupledEdge =
        (decoupleBlockingEdges && edge.from === selectedNodeKey) ||
        Boolean(pinnedNodeOverrides[edge.from]?.decoupleBlockingEdges);
      const isBlastEdge =
        hasActiveIntervention &&
        !isDecoupledEdge &&
        (intervenedOriginSet.has(edge.from) || blastSet.has(edge.from)) &&
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

      return `<g><path d="${pathD}" class="${edgeClass}" marker-end="${markerId}"><title>${escapeHtmlText(edgeTooltip)}</title></path></g>`;
    })
    .join('');

  // Render Terminal Teamwork Graph Goal Capsules on the right edge + edges from rightmost lane nodes
  const goalsToRender =
    activeSim.goalImpacts.length > 0
      ? activeSim.goalImpacts
      : graph.goals.map((g) => ({
          goalId: g.id,
          goalKey: g.key,
          goalName: g.name,
          ownerTeam: g.ownerTeam,
          targetDate: g.targetDate,
          p85CompletionDate: g.targetDate,
          probabilityOfOnTime: 0.85,
          status: g.status,
          rippleDelayDays: 0,
        }));

  // Find rightmost node in each lane to connect to Terminal Goal Capsules
  const rightmostByLane = new Map<number, { key: string; x: number; y: number }>();
  for (const [key, pos] of Object.entries(coords)) {
    const prev = rightmostByLane.get(pos.laneIndex);
    if (!prev || pos.x >= prev.x) {
      rightmostByLane.set(pos.laneIndex, { key, x: pos.x, y: pos.y });
    }
  }

  const goalNodesAndEdges = goalsToRender
    .map((goal, gIdx) => {
      const targetLaneIdx = Math.min(activeTeams.length - 1, gIdx % activeTeams.length);
      const yTopBand = targetLaneIdx * laneHeight + 6;
      const goalY =
        activeTeams.length === 1
          ? goalsToRender.length === 1
            ? 234
            : gIdx === 0
              ? 154
              : 314
          : yTopBand + Math.round((laneHeight - 8) / 2);
      const pillW = 160;
      const pillH = 48;
      const pillLeft = goalColX - pillW / 2;
      const pillTop = goalY - pillH / 2;

      const isMint = gIdx % 2 === 0;
      const pillFill =
        goal.status === 'Off Track'
          ? '#FFE4E6'
          : isMint
            ? '#6EE7B7'
            : '#6D28D9';
      const pillStroke =
        goal.status === 'Off Track'
          ? '#E11D48'
          : isMint
            ? '#059669'
            : '#4C1D95';
      const pillTextFill =
        goal.status === 'Off Track'
          ? '#881337'
          : isMint
            ? '#064E3B'
            : '#FFFFFF';
      const pillSubFill =
        goal.status === 'Off Track'
          ? '#9F1239'
          : isMint
            ? '#065F46'
            : '#DDD6FE';

      const shortGoalName =
        goal.goalName.length > 18
          ? `${goal.goalName.slice(0, 17)}…`
          : goal.goalName;

      const sourceNode = rightmostByLane.get(targetLaneIdx);
      let goalEdge = '';
      if (sourceNode) {
        const x1 = sourceNode.x + edgeRadiusOffset;
        const y1 = sourceNode.y;
        const x2 = pillLeft;
        const y2 = goalY;
        const dx = Math.max(28, (x2 - x1) * 0.45);
        goalEdge = `<path d="M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}" class="dag-edge" marker-end="url(#arrow-default)" />`;
      }

      return `
        <g>
          ${goalEdge}
          <g transform="translate(${pillLeft}, ${pillTop})">
            <rect width="${pillW}" height="${pillH}" rx="24" fill="${pillFill}" stroke="${pillStroke}" stroke-width="2" />
            <text x="${pillW / 2}" y="20" text-anchor="middle" fill="${pillTextFill}" font-size="11.5" font-weight="800">
              ${escapeHtmlText(shortGoalName)}
            </text>
            <text x="${pillW / 2}" y="35" text-anchor="middle" fill="${pillSubFill}" font-size="9.5" font-weight="700">
              Target: ${formatFriendlyDate(goal.p85CompletionDate)} · ${Math.round(goal.probabilityOfOnTime * 100)}% on time
            </text>
          </g>
        </g>
      `;
    })
    .join('');

  // Render 4-Shape Nodes (Circle = Task/Epic, Hexagon = Blocker, Diamond = Stage Gate)
  const nodeElements = graph.nodes
    .map((node) => {
      const pos = coords[node.key];
      if (!pos) return '';

      const stat = activeSim.nodeStats[node.key];
      const isSelected = node.key === selectedNodeKey;
      const pinIndex = pinnedKeys.indexOf(node.key);
      const nodePinOv = pinnedNodeOverrides[node.key];
      const isIntervenedOrigin = intervenedKey === node.key || Boolean(nodePinOv);
      const isPersonHighlighted =
        simulatorMode === 'person' &&
        Boolean(selectedAssignee) &&
        node.assignee === selectedAssignee;
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
      if (isPersonHighlighted) groupClass += ' person-highlighted';

      // Sub-task / Epic completion metrics (Concept 1 node presentation)
      const totalSub =
        node.subtaskTotalCount ??
        Math.max(3, Math.min(8, Math.round(node.baseEstimateDays)));
      let doneSub = node.subtaskDoneCount ?? 0;
      let progPct = node.subtaskProgressPct ?? stat?.completionStepPct ?? 0;

      if (temporalState === 'Done') {
        doneSub = totalSub;
        progPct = 100;
      } else if (temporalState === 'In Progress' && progPct === 0) {
        doneSub = Math.max(1, Math.round(totalSub * 0.67));
        progPct = Math.round((doneSub / totalSub) * 100);
      } else if (temporalState === 'At Risk / Blocked' && progPct === 0) {
        doneSub = Math.max(1, Math.round(totalSub * 0.4));
        progPct = Math.round((doneSub / totalSub) * 100);
      } else if (doneSub === 0 && progPct > 0 && totalSub > 1) {
        doneSub = Math.min(totalSub - 1, Math.max(1, Math.round((progPct / 100) * totalSub)));
      }

      const avatarInitials = getInitials(node.assignee);
      const avatarBg = getAvatarColor(node.assignee);
      const rippleShift = stat?.rippleDelayDays ?? 0;
      const goalObj = graph.goals.find((g) => g.id === node.goalId);

      // Determine which of the 4 shapes this node takes:
      const shapeKind = resolveNodeShapeKind(
        node,
        topBlockerKey,
        topBlockerSet,
        isIntervenedOrigin,
        delayDays
      );
      const isDiamondGate = shapeKind === 'gate';
      const isHexagonBlocker = shapeKind === 'blocker';

      const shapeType = isDiamondGate
        ? 'Gate'
        : isHexagonBlocker
          ? 'Blocker'
          : 'Task';

      const hoverStateLabel =
        temporalState === 'At Risk / Blocked' ? 'Blocked' : temporalState;

      const blockedByKeys = blockedByMap.get(node.key) ?? [];
      const blocksKeys = blocksMap.get(node.key) ?? [];

      const hoverJson = JSON.stringify({
        key: node.key,
        summary: node.summary,
        team: node.team,
        assignee: node.assignee,
        status: `${hoverStateLabel} · ${shapeType}`,
        estimateDays: node.baseEstimateDays,
        sigma: node.uncertaintySigma,
        pertMean: stat?.pertMeanDays ?? node.baseEstimateDays,
        pertSigma: stat?.pertSigmaDays ?? node.uncertaintySigma,
        completionStepPct: progPct,
        subtaskLabel: `${doneSub}/${totalSub} Sub-tasks (${progPct}%)`,
        totalFloatDays: stat?.totalFloatDays ?? 0,
        isStageGate: isDiamondGate,
        goalName: goalObj?.name ?? node.goalId,
        p85Date: stat ? formatFriendlyDate(stat.p85Date, true) : 'N/A',
        rippleShift: rippleShift,
        criticalityPct: Math.round((stat?.criticalityIndex ?? 0) * 100),
        blockedByKeys,
        blocksKeys,
        adr: node.confluenceDecision
          ? `${node.confluenceDecision.title} (${node.confluenceDecision.spaceKey})`
          : '',
      });

      // Top What-If intervention / slip badge (supports multi-pinned nodes + person highlight)
      const circledNums = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
      const effectiveBadgeOv: NodeInterventionOverride | null =
        isSelected && hasCurrentNodeIntervention
          ? { deltaDays: delayDays, addDeveloper, decoupleBlockingEdges, trimScope }
          : nodePinOv ?? null;

      let shiftBadge = '';
      if (effectiveBadgeOv) {
        const badgePrefix = pinIndex >= 0 ? `${circledNums[pinIndex] ?? `#${pinIndex + 1}`} ` : '';
        const labelText =
          effectiveBadgeOv.deltaDays > 0
            ? `${badgePrefix}+${effectiveBadgeOv.deltaDays}d Delay`
            : effectiveBadgeOv.deltaDays < 0
              ? `${badgePrefix}${effectiveBadgeOv.deltaDays}d Faster`
              : effectiveBadgeOv.addDeveloper
                ? `${badgePrefix}+1 Dev`
                : effectiveBadgeOv.decoupleBlockingEdges
                  ? `${badgePrefix}Decoupled`
                  : `${badgePrefix}Scope MVP`;
        const pillFill = pinIndex >= 0 ? '#6D28D9' : '#0C66E4';
        shiftBadge = `
          <g transform="translate(0, -56)">
            <rect x="-38" y="0" width="76" height="16" rx="8" fill="${pillFill}" />
            <text x="0" y="11.5" text-anchor="middle" fill="#FFFFFF" font-size="9" font-weight="800">
              ${escapeHtmlText(labelText)}
            </text>
          </g>
        `;
      } else if (isPersonHighlighted) {
        shiftBadge = `
          <g transform="translate(0, -56)">
            <rect x="-32" y="0" width="64" height="16" rx="8" fill="#0284C7" />
            <text x="0" y="11.5" text-anchor="middle" fill="#FFFFFF" font-size="9" font-weight="800">
              👤 ${escapeHtmlText(avatarInitials)}
            </text>
          </g>
        `;
      } else if (isInBlast && Math.abs(rippleShift) > 0) {
        const signText =
          rippleShift > 0
            ? `+${rippleShift.toFixed(1)}d Slip`
            : `${rippleShift.toFixed(1)}d`;
        const fillCol = rippleShift > 0 ? '#E11D48' : '#059669';
        shiftBadge = `
          <g transform="translate(0, -56)">
            <rect x="-32" y="0" width="64" height="16" rx="8" fill="${fillCol}" />
            <text x="0" y="11.5" text-anchor="middle" fill="#FFFFFF" font-size="9" font-weight="800">
              ${signText}
            </text>
          </g>
        `;
      }

      // SHAPE 3: ◆ DIAMOND STAGE GATE
      if (isDiamondGate) {
        const shortGateTitle =
          node.summary.length > 14
            ? `${node.summary.slice(0, 13)}…`
            : node.summary;
        const diamondStroke = isSelected ? '#0C66E4' : '#5B21B6';
        return `
          <g
            class="${groupClass}"
            data-node-key="${escapeHtmlText(node.key)}"
            data-node-x="${pos.x}"
            data-node-hover="${escapeHtmlText(hoverJson)}"
            transform="translate(${pos.x}, ${pos.y})"
          >
            ${
              isSelected || isPersonHighlighted || pinIndex >= 0
                ? `<polygon points="0,-54 54,0 0,54 -54,0" fill="none" stroke="${
                    pinIndex >= 0 ? '#6D28D9' : isPersonHighlighted ? '#0284C7' : '#0C66E4'
                  }" stroke-width="3" stroke-dasharray="${isPersonHighlighted && !isSelected ? '5 3' : '4 3'}" />`
                : ''
            }
            <polygon points="0,-48 48,0 0,48 -48,0" fill="#7C3AED" stroke="${diamondStroke}" stroke-width="2.5" stroke-linejoin="round" />
            <!-- Top small diamond badge -->
            <polygon points="0,-34 7,-27 0,-20 -7,-27" fill="#EDE9FE" />
            <polygon points="0,-30 3.5,-27 0,-24 -3.5,-27" fill="#6D28D9" />
            <!-- Gate label -->
            <text x="0" y="-8" text-anchor="middle" fill="#FFFFFF" font-size="10.5" font-weight="800">
              Gate: ${escapeHtmlText(node.key)}
            </text>
            <text x="0" y="5" text-anchor="middle" fill="#EDE9FE" font-size="9" font-weight="600">
              ${escapeHtmlText(shortGateTitle)}
            </text>
            <!-- Responsible Lead Avatar Circle -->
            <circle cx="0" cy="21" r="11.5" fill="${avatarBg}" stroke="#FFFFFF" stroke-width="1.8" />
            <text x="0" y="25" text-anchor="middle" fill="#FFFFFF" font-size="9.5" font-weight="800">
              ${escapeHtmlText(avatarInitials)}
            </text>
            <circle cx="8" cy="29" r="3.5" fill="#10B981" stroke="#FFFFFF" stroke-width="1" />
            ${shiftBadge}
          </g>
        `;
      }

      // SHAPE 2: ⬢ HEXAGON CRITICAL PATH BLOCKER
      if (isHexagonBlocker) {
        const shortHexTitle =
          node.summary.length > 15
            ? `${node.summary.slice(0, 14)}…`
            : node.summary;
        const hexPerim = 248;
        const hexFilled = Math.max(
          28,
          Math.round((Math.max(15, progPct) / 100) * hexPerim)
        );
        return `
          <g
            class="${groupClass}"
            data-node-key="${escapeHtmlText(node.key)}"
            data-node-x="${pos.x}"
            data-node-hover="${escapeHtmlText(hoverJson)}"
            transform="translate(${pos.x}, ${pos.y})"
          >
            ${
              isSelected || isPersonHighlighted || pinIndex >= 0
                ? `<polygon points="0,-54 47,-27 47,27 0,54 -47,27 -47,-27" fill="none" stroke="${
                    pinIndex >= 0 ? '#6D28D9' : isPersonHighlighted ? '#0284C7' : '#0C66E4'
                  }" stroke-width="3" ${isPersonHighlighted && !isSelected ? 'stroke-dasharray="5 3"' : ''} />`
                : ''
            }
            <!-- Outer Coral-Red Blocker Hexagon -->
            <polygon points="0,-48 42,-24 42,24 0,48 -42,24 -42,-24" fill="#EF4444" stroke="#B91C1C" stroke-width="2.5" stroke-linejoin="round" />
            <!-- Inner Progress Shield -->
            <polygon points="0,-42 36,-21 36,21 0,42 -36,21 -36,-21" fill="#DC2626" stroke="#FCA5A5" stroke-width="1.5" stroke-linejoin="round" />
            <polygon points="0,-42 36,-21 36,21 0,42 -36,21 -36,-21" fill="none" stroke="#FDE047" stroke-width="3" stroke-dasharray="${hexFilled} ${hexPerim}" stroke-linecap="round" stroke-linejoin="round" />

            <!-- Warning Triangle Icon -->
            <polygon points="0,-35 7,-23 -7,-23" fill="#FEF08A" />
            <text x="0" y="-24.5" text-anchor="middle" fill="#991B1B" font-size="9" font-weight="900">!</text>

            <!-- Issue Key & Short Summary -->
            <text x="0" y="-10" text-anchor="middle" fill="#FFFFFF" font-size="11.5" font-weight="800">
              ${escapeHtmlText(node.key)}
            </text>
            <text x="0" y="2" text-anchor="middle" fill="#FFE4E6" font-size="9.2" font-weight="600">
              ${escapeHtmlText(shortHexTitle)}
            </text>

            <!-- Responsible Assignee Avatar Circle -->
            <circle cx="0" cy="19" r="12" fill="#FECDD3" stroke="#FFFFFF" stroke-width="1.8" />
            <text x="0" y="23" text-anchor="middle" fill="#881337" font-size="10" font-weight="800">
              ${escapeHtmlText(avatarInitials)}
            </text>
            <circle cx="9" cy="27" r="3.5" fill="#10B981" stroke="#FFFFFF" stroke-width="1" />
            ${shiftBadge}
          </g>
        `;
      }

      // SHAPE 1: ● CIRCLE STANDARD TASK / EPIC WITH SUB-TASK PROGRESS RING & ASSIGNEE AVATAR
      const radius = 44;
      const circumference = Number((2 * Math.PI * radius).toFixed(1)); // ~276.5
      const visualPct = Math.max(18, progPct);
      const arcFilled = Number(((visualPct / 100) * circumference).toFixed(1));

      const isHighRiskCircle = isInBlast && rippleShift > 0;
      const innerFill = isHighRiskCircle ? '#FFF1F2' : '#FFFFFF';
      const baseRingColor =
        temporalState === 'Done'
          ? '#10B981'
          : isSelected
            ? '#0C66E4'
            : isCritical
              ? '#F59E0B'
              : '#0284C7';
      const progressArcColor =
        temporalState === 'Done'
          ? '#059669'
          : isHighRiskCircle
            ? '#E11D48'
            : '#10B981';

      return `
        <g
          class="${groupClass}"
          data-node-key="${escapeHtmlText(node.key)}"
          data-node-x="${pos.x}"
          data-node-hover="${escapeHtmlText(hoverJson)}"
          transform="translate(${pos.x}, ${pos.y})"
        >
          ${
            isSelected || isHighRiskCircle || isPersonHighlighted || pinIndex >= 0
              ? `<circle r="50" fill="none" stroke="${
                  pinIndex >= 0
                    ? '#6D28D9'
                    : isPersonHighlighted
                      ? '#0284C7'
                      : isSelected
                        ? '#0C66E4'
                        : '#FB923C'
                }" stroke-width="${pinIndex >= 0 || isPersonHighlighted ? '3' : '2.5'}" ${
                  isPersonHighlighted && !isSelected ? 'stroke-dasharray="5 3"' : ''
                } opacity="0.8" />`
              : ''
          }
          <!-- Base Circle Track -->
          <circle r="${radius}" fill="${innerFill}" stroke="${baseRingColor}" stroke-width="6" />
          <!-- Sub-task / Epic Completion Progress Arc (Rotated from Top) -->
          <circle r="${radius}" fill="none" stroke="${progressArcColor}" stroke-width="6"
            stroke-dasharray="${arcFilled} ${circumference}" stroke-linecap="round"
            transform="rotate(-90)" />

          <!-- Sub-task Fraction & Completion % -->
          <text x="0" y="-19" text-anchor="middle" fill="#0F172A" font-size="12.5" font-weight="800">
            ${doneSub}/${totalSub}
          </text>
          <text x="0" y="-7" text-anchor="middle" fill="#334155" font-size="9.5" font-weight="700">
            Sub-tasks · ${progPct}%
          </text>

          <!-- Responsible Assignee Avatar Circle -->
          <circle cx="0" cy="10" r="12" fill="${avatarBg}" stroke="#FFFFFF" stroke-width="1.8" />
          <text x="0" y="14" text-anchor="middle" fill="#FFFFFF" font-size="10" font-weight="800">
            ${escapeHtmlText(avatarInitials)}
          </text>
          <circle cx="9" cy="18" r="3.5" fill="#10B981" stroke="#FFFFFF" stroke-width="1" />

          <!-- Bottom Jira Issue Key Pill -->
          <g transform="translate(-34, 24)">
            <rect width="68" height="17" rx="8.5" fill="#F8FAFC" stroke="#94A3B8" stroke-width="1.3" />
            <polygon points="10,5 14,8.5 10,12 6,8.5" fill="#0284C7" />
            <text x="38" y="12" text-anchor="middle" fill="#0F172A" font-size="10" font-weight="800">
              ${escapeHtmlText(node.key)}
            </text>
          </g>

          ${shiftBadge}
        </g>
      `;
    })
    .join('');

  const nodeByKey = new Map(graph.nodes.map((n) => [n.key, n]));
  const orderedJumpNodes: CausalNode[] = [];
  const seenKeys = new Set<string>();
  for (const k of graph.topologicalOrder) {
    const found = nodeByKey.get(k);
    if (found && !seenKeys.has(found.key)) {
      orderedJumpNodes.push(found);
      seenKeys.add(found.key);
    }
  }
  for (const n of graph.nodes) {
    if (!seenKeys.has(n.key)) {
      orderedJumpNodes.push(n);
      seenKeys.add(n.key);
    }
  }

  const jumpOptionsHtml = orderedJumpNodes
    .map((n) => {
      const sKind = resolveNodeShapeKind(
        n,
        topBlockerKey,
        topBlockerSet,
        intervenedKey === n.key,
        delayDays
      );
      const shapeGlyph = sKind === 'gate' ? '◆' : sKind === 'blocker' ? '⬢' : '●';
      const shortSum = n.summary.length > 22 ? `${n.summary.slice(0, 21)}…` : n.summary;
      return `<option value="${escapeHtmlText(n.key)}" ${n.key === selectedNodeKey ? 'selected' : ''}>${shapeGlyph} ${escapeHtmlText(n.key)} · ${escapeHtmlText(shortSum)}</option>`;
    })
    .join('');

  return `
    <div class="panel-card dag-panel-card" data-drop-zone="dag">
      <div class="panel-header">
        <div class="panel-title">
          ${renderDragHandleBadge('dag', 'Issue Dependency Map')}
          <span class="stage-heading-title">Issue Dependency Map (${escapeHtmlText(graph.projectName)})</span>
          ${renderInfoTooltip(
            'Issue Dependency Map & Jira Team Swimlanes',
            'Swimlanes reflect real Jira Teams configured on your issues (via the Jira Team field or team:<Name> labels). If your Jira project has no teams configured, all issues are shown inside a single unified "No Team Assigned" swimlane without inventing fake teams. ● Circle = Task / Epic | ⬢ Hexagon = Critical Path Blocker | ◆ Diamond = Stage Gate | ▬ Pill = Teamwork Graph Goal.',
            `Active Swimlanes (${activeTeams.length}): ${activeTeams.map((t) => t.name).join(' · ')}`
          )}
        </div>
        <div class="dag-header-controls">
          <div class="dag-legend">
            <span class="legend-item"><span class="shape-badge-circle">●</span> Task / Epic</span>
            <span class="legend-item"><span class="shape-badge-hex">⬢</span> Blocker</span>
            <span class="legend-item"><span class="shape-badge-diamond">◆</span> Gate</span>
            <span class="legend-item"><span class="shape-badge-pill">▬</span> Goal</span>
          </div>
          <div class="dag-pan-buttons">
            <button class="dag-pan-btn" id="btn-dag-pan-left" title="Scroll dependency map left">◀</button>
            <select id="dag-issue-jump-select" class="dag-issue-jump-select" title="Jump directly to any issue in the Dependency Map (or press [ and ] keys)" aria-label="Jump to Jira issue">${jumpOptionsHtml}</select>
            <button class="dag-pan-btn" id="btn-dag-center-selected" title="Center map on selected issue (${escapeHtmlText(selectedNodeKey)})">🎯</button>
            <button class="dag-pan-btn" id="btn-dag-pan-right" title="Scroll dependency map right">▶</button>
          </div>
        </div>
      </div>

      <!-- Floating Hover Inspector Card (Pinned in top-right of Dependency Map) -->
      <div id="dag-node-hover-card" class="dag-hover-card"></div>

      <div class="dag-viewport" id="dag-viewport-container">
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" class="dag-svg" id="pwm-dag-svg">
          <defs>
            <marker id="arrow-default" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="#64748B" />
            </marker>
            <marker id="arrow-critical" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="#EA580C" />
            </marker>
            <marker id="arrow-blast" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="#E11D48" />
            </marker>
          </defs>
          ${laneBands}
          ${edgePaths}
          ${goalNodesAndEdges}
          ${nodeElements}
        </svg>
      </div>
    </div>
  `;
}
