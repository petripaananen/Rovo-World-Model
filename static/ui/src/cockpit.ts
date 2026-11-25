/**
 * Rovo-World-Model — Main Custom UI Cockpit Controller (`static/ui/src/cockpit.ts`)
 *
 * Uses Atlassian Forge's `window.__bridge.callBridge('invoke', ...)` to load real Jira projects
 * (e.g., `BloomPath Sprint (BLP)`, `Triton (TRI)`) and their live issues directly from Jira Cloud.
 */

import { addCalendarDays, buildDAGFromJiraIssues } from '../../../src/engine/dag';
import { runIntervention, runMonteCarloSimulation } from '../../../src/engine/simulator';
import {
  AssigneeInterventionOverride,
  CausalGraph,
  InterventionResult,
  NodeInterventionOverride,
  SimulationResult,
} from '../../../src/engine/types';
import { renderDagCanvas } from './components/DagCanvas';
import {
  JiraProjectOption,
  renderLeftStatusRail,
  renderTopAppBar,
} from './components/HeaderBar';
import {
  buildRovoMitigationPrompt,
  renderScenarioPanel,
} from './components/ScenarioPanel';
import { renderTimelineScrubber } from './components/TimelineScrubber';
import { DraggablePanelId, escapeHtmlText } from './components/tooltip';

type ColumnSlotId = 'left-rail' | 'center-stage' | 'scenario';
type CenterSlotId = 'dag' | 'scrubber';

const DEFAULT_COLUMN_ORDER: ColumnSlotId[] = ['left-rail', 'center-stage', 'scenario'];
const DEFAULT_CENTER_ORDER: CenterSlotId[] = ['dag', 'scrubber'];
const LAYOUT_STORAGE_KEY = 'pwm_cockpit_layout_v1';

interface SavedCockpitLayout {
  columnOrder: ColumnSlotId[];
  centerOrder: CenterSlotId[];
}

function loadSavedLayout(): SavedCockpitLayout {
  try {
    const raw = window.localStorage?.getItem(LAYOUT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SavedCockpitLayout>;
      const validCols =
        Array.isArray(parsed.columnOrder) &&
        parsed.columnOrder.length === 3 &&
        DEFAULT_COLUMN_ORDER.every((c) => parsed.columnOrder!.includes(c));
      const validCenter =
        Array.isArray(parsed.centerOrder) &&
        parsed.centerOrder.length === 2 &&
        DEFAULT_CENTER_ORDER.every((c) => parsed.centerOrder!.includes(c));
      if (validCols && validCenter) {
        return {
          columnOrder: [...parsed.columnOrder!] as ColumnSlotId[],
          centerOrder: [...parsed.centerOrder!] as CenterSlotId[],
        };
      }
    }
  } catch {
    // Ignore localStorage access restrictions in sandboxed Jira iframes
  }
  return {
    columnOrder: [...DEFAULT_COLUMN_ORDER],
    centerOrder: [...DEFAULT_CENTER_ORDER],
  };
}

function persistSavedLayout(columnOrder: ColumnSlotId[], centerOrder: CenterSlotId[]): void {
  try {
    window.localStorage?.setItem(
      LAYOUT_STORAGE_KEY,
      JSON.stringify({ columnOrder, centerOrder })
    );
  } catch {
    // Ignore localStorage write errors in sandboxed iframes
  }
}

function isCustomCockpitLayout(
  columnOrder: ColumnSlotId[],
  centerOrder: CenterSlotId[]
): boolean {
  return (
    columnOrder.join(',') !== DEFAULT_COLUMN_ORDER.join(',') ||
    centerOrder.join(',') !== DEFAULT_CENTER_ORDER.join(',')
  );
}

function getGridColsModifierClass(order: ColumnSlotId[]): string {
  switch (order.join('_')) {
    case 'scenario_center-stage_left-rail':
      return 'cols-right-center-left';
    case 'left-rail_scenario_center-stage':
      return 'cols-left-right-center';
    case 'scenario_left-rail_center-stage':
      return 'cols-right-left-center';
    case 'center-stage_left-rail_scenario':
      return 'cols-center-left-right';
    case 'center-stage_scenario_left-rail':
      return 'cols-center-right-left';
    default:
      return 'cols-left-center-right';
  }
}

const initialLayout = loadSavedLayout();

interface CockpitState {
  availableProjects: JiraProjectOption[];
  graph: CausalGraph;
  baselineSim: SimulationResult;
  activeSim: SimulationResult;
  intervention: InterventionResult | null;
  selectedNodeKey: string;
  delayDays: number;
  addDeveloper: boolean;
  decoupleBlockingEdges: boolean;
  trimScope: boolean;
  simulatorMode: 'issue' | 'person';
  pinnedNodeOverrides: Record<string, NodeInterventionOverride>;
  selectedAssignee: string;
  assigneeOverrides: Record<string, AssigneeInterventionOverride>;
  columnOrder: ColumnSlotId[];
  centerOrder: CenterSlotId[];
  selectedEpochIndex: number;
  scrubberDayOffset: number;
  activeRightTab: 'cascade' | 'bottlenecks' | 'governance' | 'rovo-mcp';
  copiedPromptNotice: boolean;
  statusBanner: string | null;
}

/**
 * Invokes Atlassian Forge Custom UI resolver via `window.__bridge.callBridge('invoke', ...)`
 * (the native runtime channel used by `@forge/bridge` inside Jira Cloud iframes).
 */
async function invokeForgeResolver<T>(
  functionKey: string,
  payload: Record<string, unknown> = {}
): Promise<T | null> {
  try {
    const win = window as unknown as {
      __bridge?: {
        callBridge?: (action: string, args?: unknown) => Promise<T>;
      };
      __forgeBridge?: {
        invoke?: (k: string, p?: unknown) => Promise<T>;
      };
    };

    if (win.__bridge && typeof win.__bridge.callBridge === 'function') {
      return await win.__bridge.callBridge('invoke', {
        functionKey,
        payload,
      });
    }
    if (win.__forgeBridge && typeof win.__forgeBridge.invoke === 'function') {
      return await win.__forgeBridge.invoke(functionKey, payload);
    }
  } catch {
    // Fallback when running outside Jira iframe
  }
  return null;
}

/**
 * Builds the default initial graph from real Jira project issues (`BloomPath Sprint (BLP)`)
 * while the live `getGraphData` bridge call completes.
 */
function createInitialRealProjectGraph(projectKey = 'BLP', projectName = 'BloomPath Sprint'): CausalGraph {
  const todayIso = new Date().toISOString().slice(0, 10);
  const dag = buildDAGFromJiraIssues(
    projectKey,
    [
      {
        id: '10007',
        key: `${projectKey}-7`,
        fields: {
          summary: 'Test Issue 2 - Progress Tracking',
          status: { name: 'To Do' },
          assignee: { displayName: 'Petri Paananen' },
          customfield_10016: 4,
          issuelinks: [
            {
              type: { name: 'Blocks', outward: 'blocks' },
              outwardIssue: { key: `${projectKey}-8` },
            },
          ],
        },
      },
      {
        id: '10008',
        key: `${projectKey}-8`,
        fields: {
          summary: 'Test Issue 3 - Sprint Health',
          status: { name: 'To Do' },
          assignee: { displayName: 'Petri Paananen' },
          customfield_10016: 5,
        },
      },
    ],
    [
      {
        id: 'GOAL-ALPHA',
        key: `${projectKey}-GOAL-1`,
        name: `${projectName} Sprint Delivery`,
        targetDate: addCalendarDays(todayIso, 18),
        targetDayOffset: 18,
        ownerTeam: 'No Team Assigned',
        status: 'On Track',
      },
      {
        id: 'GOAL-OMEGA',
        key: `${projectKey}-GOAL-2`,
        name: `${projectName} Release Milestone`,
        targetDate: addCalendarDays(todayIso, 32),
        targetDayOffset: 32,
        ownerTeam: 'No Team Assigned',
        status: 'On Track',
      },
    ],
    [],
    todayIso
  );

  return {
    ...dag,
    projectName,
    isSyntheticDemo: false,
  };
}

function pickDefaultAssignee(graph: CausalGraph): string {
  const counts = new Map<string, number>();
  for (const node of graph.nodes) {
    const a = node.assignee || 'Unassigned';
    counts.set(a, (counts.get(a) ?? 0) + (node.status.toLowerCase() === 'done' ? 0.1 : 1));
  }
  const sorted = Array.from(counts.entries()).sort((a, b) => {
    if (a[0].toLowerCase() === 'unassigned') return 1;
    if (b[0].toLowerCase() === 'unassigned') return -1;
    return b[1] - a[1];
  });
  return sorted[0]?.[0] ?? 'Unassigned';
}

const initialGraph = createInitialRealProjectGraph('BLP', 'BloomPath Sprint');
const initialBaseline = runMonteCarloSimulation(initialGraph, { iterations: 500 });

const state: CockpitState = {
  availableProjects: [
    { id: 'BLP', key: 'BLP', name: 'BloomPath Sprint' },
    { id: 'KAN', key: 'KAN', name: 'Triton' },
  ],
  graph: initialGraph,
  baselineSim: initialBaseline,
  activeSim: initialBaseline,
  intervention: null,
  selectedNodeKey: initialGraph.nodes[0]?.key ?? 'BLP-7',
  delayDays: 0,
  addDeveloper: false,
  decoupleBlockingEdges: false,
  trimScope: false,
  simulatorMode: 'issue',
  pinnedNodeOverrides: {},
  selectedAssignee: pickDefaultAssignee(initialGraph),
  assigneeOverrides: {},
  columnOrder: initialLayout.columnOrder,
  centerOrder: initialLayout.centerOrder,
  selectedEpochIndex: 2, // Today
  scrubberDayOffset: 0,
  activeRightTab: 'cascade',
  copiedPromptNotice: false,
  statusBanner:
    'Connected to Jira project — Click any issue card or drag the Schedule Change slider to simulate timeline impacts.',
};

function getMergedNodeOverrides(): Record<string, NodeInterventionOverride> {
  const merged: Record<string, NodeInterventionOverride> = {
    ...state.pinnedNodeOverrides,
  };
  if (
    state.selectedNodeKey &&
    (state.delayDays !== 0 ||
      state.addDeveloper ||
      state.decoupleBlockingEdges ||
      state.trimScope)
  ) {
    merged[state.selectedNodeKey] = {
      deltaDays: state.delayDays,
      addDeveloper: state.addDeveloper,
      decoupleBlockingEdges: state.decoupleBlockingEdges,
      trimScope: state.trimScope,
    };
  }
  return merged;
}

function getActiveAssigneeOverrides(): Record<string, AssigneeInterventionOverride> {
  const active: Record<string, AssigneeInterventionOverride> = {};
  for (const [name, aOv] of Object.entries(state.assigneeOverrides)) {
    const uDays = Number(aOv.unavailableDays ?? 0);
    if (
      uDays !== 0 ||
      aOv.reassignBottleneck ||
      aOv.serializeParallelWork ||
      aOv.pairOnTopBlocker
    ) {
      active[name] = aOv;
    }
  }
  return active;
}

function syncCurrentNodeToPinIfPinned(): void {
  if (state.selectedNodeKey && state.pinnedNodeOverrides[state.selectedNodeKey]) {
    state.pinnedNodeOverrides[state.selectedNodeKey] = {
      deltaDays: state.delayDays,
      addDeveloper: state.addDeveloper,
      decoupleBlockingEdges: state.decoupleBlockingEdges,
      trimScope: state.trimScope,
    };
  }
}

function switchSelectedIssue(nextKey: string, autoPinPrevious = false): void {
  if (!nextKey) return;
  if (
    autoPinPrevious &&
    state.selectedNodeKey &&
    state.selectedNodeKey !== nextKey &&
    (state.delayDays !== 0 ||
      state.addDeveloper ||
      state.decoupleBlockingEdges ||
      state.trimScope)
  ) {
    state.pinnedNodeOverrides[state.selectedNodeKey] = {
      deltaDays: state.delayDays,
      addDeveloper: state.addDeveloper,
      decoupleBlockingEdges: state.decoupleBlockingEdges,
      trimScope: state.trimScope,
    };
  }

  state.selectedNodeKey = nextKey;
  const existingPin = state.pinnedNodeOverrides[nextKey];
  if (existingPin) {
    state.delayDays = existingPin.deltaDays;
    state.addDeveloper = Boolean(existingPin.addDeveloper);
    state.decoupleBlockingEdges = Boolean(existingPin.decoupleBlockingEdges);
    state.trimScope = Boolean(existingPin.trimScope);
  } else {
    state.delayDays = 0;
    state.addDeveloper = false;
    state.decoupleBlockingEdges = false;
    state.trimScope = false;
  }
  state.copiedPromptNotice = false;
}

function getOrCreateAssigneeOverride(name: string): AssigneeInterventionOverride {
  if (!state.assigneeOverrides[name]) {
    state.assigneeOverrides[name] = {
      assignee: name,
      unavailableDays: 0,
      reassignBottleneck: false,
      serializeParallelWork: false,
      pairOnTopBlocker: false,
    };
  }
  return state.assigneeOverrides[name];
}

function recomputeSimulation(): void {
  state.baselineSim = runMonteCarloSimulation(state.graph, { iterations: 500 });
  const mergedNodes = getMergedNodeOverrides();
  const activeAssignees = getActiveAssigneeOverrides();
  const nodeKeys = Object.keys(mergedNodes);
  const assigneeKeys = Object.keys(activeAssignees);
  const hasIntervention = nodeKeys.length > 0 || assigneeKeys.length > 0;

  if (hasIntervention) {
    const primaryKey =
      (mergedNodes[state.selectedNodeKey] ? state.selectedNodeKey : nodeKeys[0]) ||
      state.selectedNodeKey ||
      state.graph.nodes[0]?.key ||
      '';
    const primaryOv = mergedNodes[primaryKey] ?? { deltaDays: 0 };
    const intResult = runIntervention(
      state.graph,
      primaryKey,
      primaryOv.deltaDays,
      {
        iterations: 500,
        addDeveloper: Boolean(primaryOv.addDeveloper),
        decoupleBlockingEdges: Boolean(primaryOv.decoupleBlockingEdges),
        trimScope: Boolean(primaryOv.trimScope),
        nodeOverrides: mergedNodes,
        assigneeOverrides: activeAssignees,
      }
    );
    state.intervention = intResult;
    state.activeSim = intResult;
  } else {
    state.intervention = null;
    state.activeSim = state.baselineSim;
  }
}

// Shared Drag & Drop module state (prevents duplicate listener collisions across slider partial renders)
let activeDraggedPanel: DraggablePanelId | null = null;
let didDragDuringPress = false;

function scrollDagToSelectedNode(smooth = true): void {
  const viewport = document.getElementById('dag-viewport-container');
  if (!viewport) return;
  const selectedEl = viewport.querySelector<SVGGElement>(
    `.dag-node-group[data-node-key="${state.selectedNodeKey}"]`
  );
  if (!selectedEl) return;
  const nodeX = Number(selectedEl.getAttribute('data-node-x') ?? 0);
  const targetLeft = Math.max(0, nodeX - viewport.clientWidth / 2 + 100);
  if (typeof viewport.scrollTo === 'function') {
    viewport.scrollTo({
      left: targetLeft,
      behavior: smooth ? 'smooth' : 'auto',
    });
  } else {
    viewport.scrollLeft = targetLeft;
  }
}

function toColumnSlot(panelId: DraggablePanelId): ColumnSlotId {
  if (panelId === 'dag' || panelId === 'scrubber') return 'center-stage';
  return panelId;
}

function swapPanels(sourcePanel: DraggablePanelId, targetPanel: DraggablePanelId): void {
  if (sourcePanel === targetPanel) return;
  if (
    (sourcePanel === 'dag' && targetPanel === 'scrubber') ||
    (sourcePanel === 'scrubber' && targetPanel === 'dag')
  ) {
    state.centerOrder = [state.centerOrder[1], state.centerOrder[0]];
    persistSavedLayout(state.columnOrder, state.centerOrder);
    state.statusBanner =
      'Swapped Issue Dependency Map and Timeline Scrubber positions (saved).';
    renderCockpit();
    return;
  }

  const srcCol = toColumnSlot(sourcePanel);
  const dstCol = toColumnSlot(targetPanel);
  if (srcCol === dstCol) return;

  const nextCols = [...state.columnOrder];
  const srcIdx = nextCols.indexOf(srcCol);
  const dstIdx = nextCols.indexOf(dstCol);
  if (srcIdx === -1 || dstIdx === -1) return;

  nextCols[srcIdx] = dstCol;
  nextCols[dstIdx] = srcCol;
  state.columnOrder = nextCols;
  persistSavedLayout(state.columnOrder, state.centerOrder);
  state.statusBanner =
    'Panel layout updated — drag any top-corner ⠿⇄ icon to move panels or click ⇄ Reset Layout.';
  renderCockpit();
}

export function renderCockpit(
  activeSliderId?: 'delay-slider-input' | 'person-pto-slider-input' | 'time-machine-range'
): void {
  const root = document.getElementById('app-root');
  if (!root) return;

  const dagViewport = document.getElementById('dag-viewport-container');
  const prevDagScrollLeft = dagViewport?.scrollLeft ?? 0;
  const prevDagScrollTop = dagViewport?.scrollTop ?? 0;

  const mergedNodes = getMergedNodeOverrides();
  const activeAssignees = getActiveAssigneeOverrides();
  const hasAnyIntervention =
    Object.keys(mergedNodes).length > 0 || Object.keys(activeAssignees).length > 0;
  const isCustomLayout = isCustomCockpitLayout(state.columnOrder, state.centerOrder);

  const headerProps = {
    availableProjects: state.availableProjects,
    graph: state.graph,
    baselineSim: state.baselineSim,
    activeSim: state.activeSim,
    intervention: state.intervention,
    selectedNodeKey: state.selectedNodeKey,
    delayDays: state.delayDays,
    addDeveloper: state.addDeveloper,
    decoupleBlockingEdges: state.decoupleBlockingEdges,
    hasAnyIntervention,
    isCustomLayout,
    statusBanner: state.statusBanner,
  };

  const headerHtml = renderTopAppBar(headerProps);
  const leftRailHtml = renderLeftStatusRail(headerProps);

  const scrubberHtml = renderTimelineScrubber({
    graph: state.graph,
    activeSim: state.activeSim,
    selectedEpochIndex: state.selectedEpochIndex,
    scrubberDayOffset: state.scrubberDayOffset,
    hasActiveIntervention: hasAnyIntervention,
  });

  const dagHtml = renderDagCanvas({
    graph: state.graph,
    activeSim: state.activeSim,
    selectedNodeKey: state.selectedNodeKey,
    delayDays: state.delayDays,
    addDeveloper: state.addDeveloper,
    decoupleBlockingEdges: state.decoupleBlockingEdges,
    trimScope: state.trimScope,
    scrubberDayOffset: state.scrubberDayOffset,
    simulatorMode: state.simulatorMode,
    pinnedNodeOverrides: state.pinnedNodeOverrides,
    selectedAssignee: state.selectedAssignee,
    assigneeOverrides: state.assigneeOverrides,
  });

  const scenarioHtml = renderScenarioPanel({
    graph: state.graph,
    baselineSim: state.baselineSim,
    activeSim: state.activeSim,
    intervention: state.intervention,
    selectedNodeKey: state.selectedNodeKey,
    delayDays: state.delayDays,
    addDeveloper: state.addDeveloper,
    decoupleBlockingEdges: state.decoupleBlockingEdges,
    trimScope: state.trimScope,
    simulatorMode: state.simulatorMode,
    pinnedNodeOverrides: state.pinnedNodeOverrides,
    selectedAssignee: state.selectedAssignee,
    assigneeOverrides: state.assigneeOverrides,
    activeRightTab: state.activeRightTab,
    copiedPromptNotice: state.copiedPromptNotice,
  });

  const headerMount = document.getElementById('header-mount');
  const leftRailMount = document.getElementById('left-rail-mount');
  const scrubberMount = document.getElementById('scrubber-mount');
  const dagMount = document.getElementById('dag-mount');
  const scenarioMount = document.getElementById('scenario-mount');

  if (
    activeSliderId &&
    headerMount &&
    leftRailMount &&
    scrubberMount &&
    dagMount &&
    scenarioMount
  ) {
    headerMount.innerHTML = headerHtml;
    leftRailMount.innerHTML = leftRailHtml;
    dagMount.innerHTML = dagHtml;
    const nextViewport = document.getElementById('dag-viewport-container');
    if (nextViewport) {
      nextViewport.scrollLeft = prevDagScrollLeft;
      nextViewport.scrollTop = prevDagScrollTop;
    }
    if (
      activeSliderId === 'delay-slider-input' ||
      activeSliderId === 'person-pto-slider-input'
    ) {
      scrubberMount.innerHTML = scrubberHtml;

      const tmp = document.createElement('div');
      tmp.innerHTML = scenarioHtml;

      const curLozenge = scenarioMount.querySelector('.panel-header .jira-lozenge');
      const nextLozenge = tmp.querySelector('.panel-header .jira-lozenge');
      if (curLozenge && nextLozenge) curLozenge.replaceWith(nextLozenge);

      const curStack = scenarioMount.querySelector('.scenario-stack-bar');
      const nextStack = tmp.querySelector('.scenario-stack-bar');
      if (curStack && nextStack) curStack.innerHTML = nextStack.innerHTML;

      const curCompare = scenarioMount.querySelector('.comparison-bars-card');
      const nextCompare = tmp.querySelector('.comparison-bars-card');
      if (curCompare && nextCompare) curCompare.innerHTML = nextCompare.innerHTML;

      const curTabs = scenarioMount.querySelector('.tab-bar');
      const nextTabs = tmp.querySelector('.tab-bar');
      if (curTabs && nextTabs) curTabs.innerHTML = nextTabs.innerHTML;

      const curTabBody = scenarioMount.querySelector('.tab-body');
      const nextTabBody = tmp.querySelector('.tab-body');
      if (curTabBody && nextTabBody) curTabBody.innerHTML = nextTabBody.innerHTML;

      if (activeSliderId === 'delay-slider-input') {
        const readoutEl = scenarioMount.querySelector('.slider-readout');
        if (readoutEl) {
          readoutEl.textContent =
            state.delayDays > 0
              ? `+${state.delayDays} Days Delay`
              : state.delayDays < 0
                ? `${state.delayDays} Days Faster`
                : '0 Days (Baseline)';
          readoutEl.className = `slider-readout ${
            state.delayDays < 0
              ? 'accel-text'
              : state.delayDays === 0
                ? 'neutral-text'
                : ''
          }`;
        }
        scenarioMount
          .querySelectorAll<HTMLButtonElement>('[data-preset-delay]')
          .forEach((btn) => {
            const d = Number(btn.getAttribute('data-preset-delay') ?? 0);
            btn.classList.toggle('active', d === state.delayDays);
          });
      } else {
        const pOv = getOrCreateAssigneeOverride(state.selectedAssignee);
        const ptoDays = Number(pOv.unavailableDays ?? 0);
        const readoutEl = scenarioMount.querySelector('.slider-readout');
        if (readoutEl) {
          readoutEl.textContent =
            ptoDays > 0
              ? `+${ptoDays} Days Away`
              : ptoDays < 0
                ? `${ptoDays} Days Focus Gain`
                : '0 Days (Normal Capacity)';
          readoutEl.className = `slider-readout ${
            ptoDays < 0
              ? 'accel-text'
              : ptoDays === 0
                ? 'neutral-text'
                : ''
          }`;
        }
        scenarioMount
          .querySelectorAll<HTMLButtonElement>('[data-preset-pto]')
          .forEach((btn) => {
            const d = Number(btn.getAttribute('data-preset-pto') ?? 0);
            btn.classList.toggle('active', d === ptoDays);
          });
      }
    } else if (activeSliderId === 'time-machine-range') {
      scenarioMount.innerHTML = scenarioHtml;
      scrubberMount
        .querySelectorAll<HTMLButtonElement>('[data-epoch-idx]')
        .forEach((btn) => {
          const idx = Number(btn.getAttribute('data-epoch-idx') ?? -1);
          btn.classList.toggle('active', idx === state.selectedEpochIndex);
        });
    }
    attachCockpitEventListeners(activeSliderId);
    return;
  }

  const centerSlotMarkup: Record<CenterSlotId, string> = {
    dag: `<div id="dag-mount" class="mount-contents">${dagHtml}</div>`,
    scrubber: `<div id="scrubber-mount" class="mount-contents">${scrubberHtml}</div>`,
  };
  const centerStageHtml = `
    <div class="center-stage-column">
      ${state.centerOrder.map((slotId) => centerSlotMarkup[slotId]).join('')}
    </div>
  `;

  const colSlotMarkup: Record<ColumnSlotId, string> = {
    'left-rail': `<div id="left-rail-mount" class="mount-contents">${leftRailHtml}</div>`,
    'center-stage': centerStageHtml,
    scenario: `<div id="scenario-mount" class="mount-contents">${scenarioHtml}</div>`,
  };

  root.innerHTML = `
    <div class="cockpit-shell">
      <div id="header-mount" class="mount-contents">${headerHtml}</div>
      <section class="workspace-grid-3col ${getGridColsModifierClass(state.columnOrder)}">
        ${state.columnOrder.map((colId) => colSlotMarkup[colId]).join('')}
      </section>
    </div>
  `;

  const restoredViewport = document.getElementById('dag-viewport-container');
  if (restoredViewport) {
    if (prevDagScrollLeft > 0) restoredViewport.scrollLeft = prevDagScrollLeft;
    if (prevDagScrollTop > 0) restoredViewport.scrollTop = prevDagScrollTop;
  }

  attachCockpitEventListeners();
}

async function loadJiraProjectGraph(projectKey?: string): Promise<void> {
  const remoteData = await invokeForgeResolver<{
    availableProjects?: JiraProjectOption[];
    graph?: CausalGraph;
    simulation?: SimulationResult;
  }>('getGraphData', projectKey ? { projectKey } : {});

  if (remoteData?.availableProjects && remoteData.availableProjects.length > 0) {
    state.availableProjects = remoteData.availableProjects;
  }

  if (remoteData?.graph && remoteData.graph.nodes && remoteData.graph.nodes.length >= 1) {
    state.graph = remoteData.graph;
    state.selectedNodeKey =
      remoteData.graph.nodes[0]?.key ?? state.selectedNodeKey;
    state.delayDays = 0;
    state.addDeveloper = false;
    state.decoupleBlockingEdges = false;
    state.trimScope = false;
    state.pinnedNodeOverrides = {};
    state.assigneeOverrides = {};
    state.selectedAssignee = pickDefaultAssignee(state.graph);
    recomputeSimulation();
    state.statusBanner = `Loaded live Jira project "${state.graph.projectName}" (${state.graph.projectKey}) with ${state.graph.nodes.length} ${
      state.graph.nodes.length === 1 ? 'issue' : 'issues'
    }.`;
    renderCockpit();
  } else if (projectKey) {
    const matched = state.availableProjects.find((p) => p.key === projectKey);
    state.graph = createInitialRealProjectGraph(
      projectKey,
      matched?.name ?? `${projectKey} Project`
    );
    state.selectedNodeKey = state.graph.nodes[0]?.key ?? `${projectKey}-1`;
    state.delayDays = 0;
    state.addDeveloper = false;
    state.decoupleBlockingEdges = false;
    state.trimScope = false;
    state.pinnedNodeOverrides = {};
    state.assigneeOverrides = {};
    state.selectedAssignee = pickDefaultAssignee(state.graph);
    recomputeSimulation();
    renderCockpit();
  }
}

function attachCockpitEventListeners(
  skipMountForSlider?: 'delay-slider-input' | 'person-pto-slider-input' | 'time-machine-range'
): void {
  // 0. Project Switcher Dropdown (`#jira-project-select`)
  const projectSelect = document.getElementById(
    'jira-project-select'
  ) as HTMLSelectElement | null;
  if (projectSelect) {
    projectSelect.addEventListener('change', async () => {
      const nextKey = projectSelect.value;
      state.statusBanner = `Switching to Jira project ${nextKey}…`;
      renderCockpit();
      await loadJiraProjectGraph(nextKey);
    });
  }

  // 1. Node click + hover inspector + horizontal pan controls on SVG DAG
  const hoverCard = document.getElementById('dag-node-hover-card');
  const viewportContainer = document.getElementById('dag-viewport-container');

  const btnPanLeft = document.getElementById('btn-dag-pan-left');
  if (btnPanLeft && viewportContainer) {
    btnPanLeft.addEventListener('click', () => {
      viewportContainer.scrollBy({ left: -340, behavior: 'smooth' });
    });
  }

  const btnPanRight = document.getElementById('btn-dag-pan-right');
  if (btnPanRight && viewportContainer) {
    btnPanRight.addEventListener('click', () => {
      viewportContainer.scrollBy({ left: 340, behavior: 'smooth' });
    });
  }

  const btnCenterSelected = document.getElementById('btn-dag-center-selected');
  if (btnCenterSelected) {
    btnCenterSelected.addEventListener('click', () => {
      scrollDagToSelectedNode(true);
    });
  }

  const issueJumpSelect = document.getElementById(
    'dag-issue-jump-select'
  ) as HTMLSelectElement | null;
  if (issueJumpSelect) {
    issueJumpSelect.addEventListener('change', () => {
      const nextKey = issueJumpSelect.value;
      if (nextKey) {
        switchSelectedIssue(nextKey);
        state.simulatorMode = 'issue';
        recomputeSimulation();
        renderCockpit();
        scrollDagToSelectedNode(true);
      }
    });
  }

  document.querySelectorAll<SVGGElement>('.dag-node-group').forEach((el) => {
    el.addEventListener('click', (event: MouseEvent) => {
      const key = el.getAttribute('data-node-key');
      if (key) {
        switchSelectedIssue(key, event.shiftKey);
        state.simulatorMode = 'issue';
        recomputeSimulation();
        renderCockpit();
      }
    });

    el.addEventListener('mouseenter', () => {
      if (!hoverCard) return;
      const rawHover = el.getAttribute('data-node-hover');
      if (!rawHover) return;
      try {
        const info = JSON.parse(rawHover) as {
          key: string;
          summary: string;
          team: string;
          assignee: string;
          status: string;
          estimateDays: number;
          sigma: number;
          pertMean?: number;
          pertSigma?: number;
          completionStepPct?: number;
          subtaskLabel?: string;
          totalFloatDays?: number;
          isStageGate?: boolean;
          goalName: string;
          p85Date: string;
          rippleShift: number;
          criticalityPct: number;
          blockedByKeys?: string[];
          blocksKeys?: string[];
          adr: string;
        };

        const blockedByStr =
          info.blockedByKeys && info.blockedByKeys.length > 0
            ? info.blockedByKeys.join(', ')
            : 'None';
        const blocksStr =
          info.blocksKeys && info.blocksKeys.length > 0
            ? info.blocksKeys.join(', ')
            : 'None';

        const shiftLine =
          info.rippleShift > 0
            ? `<strong class="text-danger">+${info.rippleShift.toFixed(1)}d downstream slip</strong>`
            : info.rippleShift < 0
              ? `<strong class="text-success">${info.rippleShift.toFixed(1)}d faster</strong>`
              : `<span class="text-muted">On Baseline Schedule</span>`;

        const floatDays = info.totalFloatDays ?? 0;
        const floatBadge =
          floatDays < 0
            ? `<strong class="text-danger">${floatDays.toFixed(1)}d (Super-Critical)</strong>`
            : floatDays === 0
              ? `<strong class="text-warning">0.0d (Critical Path)</strong>`
              : `<strong class="text-success">+${floatDays.toFixed(1)}d Slack</strong>`;

        const stepPct = info.completionStepPct ?? 0;
        const stepLabel =
          info.subtaskLabel ??
          (stepPct === 75
            ? '75% (Awaiting Handoff)'
            : stepPct === 100
              ? '100% (Accepted)'
              : `${stepPct}%`);

        hoverCard.innerHTML = `
          <div class="hover-card-header">
            <span class="hover-card-key">${escapeHtmlText(info.key)}${info.isStageGate ? ' · STAGE GATE' : ''}</span>
            <span class="jira-lozenge jira-lozenge-todo">${escapeHtmlText(info.status.toUpperCase())}</span>
          </div>
          <div class="hover-card-title">${escapeHtmlText(info.summary)}</div>
          <div class="hover-card-meta">
            <div><span>Assignee:</span> <strong>${escapeHtmlText(info.assignee)}</strong></div>
            <div><span>Overall Progress:</span> <strong>${escapeHtmlText(stepLabel)}</strong></div>
            <div><span>Projected Finish:</span> <strong>${escapeHtmlText(info.p85Date)}</strong></div>
            <div><span>Deadline Float:</span> ${floatBadge}</div>
            <div><span>Schedule Impact:</span> ${shiftLine}</div>
            <div><span>Blocked by:</span> <strong>${escapeHtmlText(blockedByStr)}</strong></div>
            <div><span>Blocks:</span> <strong>${escapeHtmlText(blocksStr)}</strong></div>
            <div><span>Linked Goal:</span> <strong>${escapeHtmlText(info.goalName)}</strong></div>
          </div>
          ${
            info.adr
              ? `<div class="hover-card-adr">📄 ${escapeHtmlText(info.adr)}</div>`
              : ''
          }
          <div class="hover-card-math">
            📐 <code>Expected: ${(info.pertMean ?? info.estimateDays).toFixed(1)}d (±${(info.pertSigma ?? info.sigma).toFixed(1)}d) | Critical Path Risk: ${info.criticalityPct}%</code>
          </div>
          <div class="hover-card-tip">Click issue card to select &amp; simulate</div>
        `;
        hoverCard.classList.add('is-visible');
      } catch {
        // Ignore parse issues
      }
    });

    el.addEventListener('mouseleave', () => {
      if (hoverCard) {
        hoverCard.classList.remove('is-visible');
      }
    });
  });

  // Stack chips & right panel sections updated dynamically even during slider drag
  document.querySelectorAll<HTMLElement>('[data-focus-pin]').forEach((chip) => {
    chip.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-unpin-node]')) return;
      const key = chip.getAttribute('data-focus-pin');
      if (key) {
        switchSelectedIssue(key);
        state.simulatorMode = 'issue';
        recomputeSimulation();
        renderCockpit();
        scrollDagToSelectedNode(true);
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-unpin-node]').forEach((btn) => {
    btn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      const key = btn.getAttribute('data-unpin-node');
      if (key && state.pinnedNodeOverrides[key]) {
        delete state.pinnedNodeOverrides[key];
        if (state.selectedNodeKey === key) {
          state.delayDays = 0;
          state.addDeveloper = false;
          state.decoupleBlockingEdges = false;
          state.trimScope = false;
        }
        state.copiedPromptNotice = false;
        recomputeSimulation();
        renderCockpit();
      }
    });
  });

  document.querySelectorAll<HTMLElement>('[data-focus-person]').forEach((chip) => {
    chip.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-clear-person]')) return;
      const name = chip.getAttribute('data-focus-person');
      if (name) {
        state.selectedAssignee = name;
        state.simulatorMode = 'person';
        renderCockpit();
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-clear-person]').forEach((btn) => {
    btn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      const name = btn.getAttribute('data-clear-person');
      if (name && state.assigneeOverrides[name]) {
        delete state.assigneeOverrides[name];
        state.copiedPromptNotice = false;
        recomputeSimulation();
        renderCockpit();
      }
    });
  });

  const btnClearStack = document.getElementById('btn-clear-scenario-stack');
  if (btnClearStack) {
    btnClearStack.addEventListener('click', () => {
      state.pinnedNodeOverrides = {};
      state.assigneeOverrides = {};
      state.delayDays = 0;
      state.addDeveloper = false;
      state.decoupleBlockingEdges = false;
      state.trimScope = false;
      state.copiedPromptNotice = false;
      recomputeSimulation();
      renderCockpit();
    });
  }

  // 6. Copy Rovo Mitigation Prompt Button (kept live even when slider drags)
  const btnCopyRovo = document.getElementById('btn-copy-rovo-prompt');
  if (btnCopyRovo) {
    btnCopyRovo.addEventListener('click', async () => {
      const promptText = buildRovoMitigationPrompt({
        graph: state.graph,
        baselineSim: state.baselineSim,
        activeSim: state.activeSim,
        intervention: state.intervention,
        selectedNodeKey: state.selectedNodeKey,
        delayDays: state.delayDays,
        addDeveloper: state.addDeveloper,
        decoupleBlockingEdges: state.decoupleBlockingEdges,
        trimScope: state.trimScope,
        simulatorMode: state.simulatorMode,
        pinnedNodeOverrides: state.pinnedNodeOverrides,
        selectedAssignee: state.selectedAssignee,
        assigneeOverrides: state.assigneeOverrides,
        activeRightTab: state.activeRightTab,
        copiedPromptNotice: state.copiedPromptNotice,
      });
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(promptText);
        }
      } catch {
        // Fallback when clipboard permission is restricted in sandboxed iframe
      }
      state.copiedPromptNotice = true;
      state.statusBanner = `Copied Rovo Prompt — open Rovo Chat in Jira and paste to ask @Rovo-World-Model Agent!`;
      renderCockpit();
    });
  }

  // 13. Right Panel Tabs
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab') as CockpitState['activeRightTab'];
      if (tab) {
        state.activeRightTab = tab;
        renderCockpit();
      }
    });
  });

  // 14. Clickable rows in Cascade / Bottlenecks list
  document.querySelectorAll<HTMLElement>('[data-select-node]').forEach((row) => {
    row.addEventListener('click', () => {
      const key = row.getAttribute('data-select-node');
      if (key) {
        switchSelectedIssue(key);
        state.simulatorMode = 'issue';
        recomputeSimulation();
        renderCockpit();
        scrollDagToSelectedNode(true);
      }
    });
  });

  // Pin / Unpin Current Issue (kept live inside .scenario-stack-bar even during slider drag)
  const btnPinCurrent = document.getElementById('btn-pin-current-issue');
  if (btnPinCurrent) {
    btnPinCurrent.addEventListener('click', () => {
      if (state.pinnedNodeOverrides[state.selectedNodeKey]) {
        delete state.pinnedNodeOverrides[state.selectedNodeKey];
      } else {
        state.pinnedNodeOverrides[state.selectedNodeKey] = {
          deltaDays: state.delayDays,
          addDeveloper: state.addDeveloper,
          decoupleBlockingEdges: state.decoupleBlockingEdges,
          trimScope: state.trimScope,
        };
      }
      state.copiedPromptNotice = false;
      recomputeSimulation();
      renderCockpit();
    });
  }

  if (
    skipMountForSlider !== 'delay-slider-input' &&
    skipMountForSlider !== 'person-pto-slider-input'
  ) {
    // Mode Switcher: By Issue vs. By Person & Team
    document.querySelectorAll<HTMLButtonElement>('[data-sim-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextMode = btn.getAttribute('data-sim-mode') as 'issue' | 'person';
        if (nextMode && nextMode !== state.simulatorMode) {
          state.simulatorMode = nextMode;
          if (nextMode === 'person' && !state.selectedAssignee) {
            state.selectedAssignee = pickDefaultAssignee(state.graph);
          }
          renderCockpit();
        }
      });
    });

    // 2. Delay / Accelerate Slider input (-5d to +30d)
    const delaySlider = document.getElementById(
      'delay-slider-input'
    ) as HTMLInputElement | null;
    if (delaySlider) {
      delaySlider.addEventListener('input', () => {
        state.delayDays = Number(delaySlider.value);
        syncCurrentNodeToPinIfPinned();
        state.copiedPromptNotice = false;
        recomputeSimulation();
        renderCockpit('delay-slider-input');
      });
      delaySlider.addEventListener('change', () => {
        syncCurrentNodeToPinIfPinned();
        renderCockpit();
      });
    }

    // 3. Delay / Accelerate Preset Buttons
    document.querySelectorAll<HTMLButtonElement>('[data-preset-delay]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.delayDays = Number(btn.getAttribute('data-preset-delay') ?? 0);
        syncCurrentNodeToPinIfPinned();
        state.copiedPromptNotice = false;
        recomputeSimulation();
        renderCockpit();
      });
    });

    // 4. Scope / Resource Toggle: Add Developer
    const btnAddDev = document.getElementById('btn-toggle-add-dev');
    if (btnAddDev) {
      btnAddDev.addEventListener('click', () => {
        state.addDeveloper = !state.addDeveloper;
        syncCurrentNodeToPinIfPinned();
        state.copiedPromptNotice = false;
        recomputeSimulation();
        renderCockpit();
      });
    }

    // 5. Scope / Resource Toggle: Decouple Dependency
    const btnDecouple = document.getElementById('btn-toggle-decouple-edge');
    if (btnDecouple) {
      btnDecouple.addEventListener('click', () => {
        state.decoupleBlockingEdges = !state.decoupleBlockingEdges;
        syncCurrentNodeToPinIfPinned();
        state.copiedPromptNotice = false;
        recomputeSimulation();
        renderCockpit();
      });
    }

    // 5b. Scope Toggle: Trim / Defer Scope (MVP)
    const btnTrimScope = document.getElementById('btn-toggle-trim-scope');
    if (btnTrimScope) {
      btnTrimScope.addEventListener('click', () => {
        state.trimScope = !state.trimScope;
        syncCurrentNodeToPinIfPinned();
        state.copiedPromptNotice = false;
        recomputeSimulation();
        renderCockpit();
      });
    }

    // Person Mode Listeners: Select Assignee, Unavailability Slider, Presets, Workload Mitigations
    document.querySelectorAll<HTMLButtonElement>('[data-select-assignee]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-select-assignee');
        if (name) {
          state.selectedAssignee = name;
          state.copiedPromptNotice = false;
          renderCockpit();
        }
      });
    });

    const ptoSlider = document.getElementById(
      'person-pto-slider-input'
    ) as HTMLInputElement | null;
    if (ptoSlider) {
      ptoSlider.addEventListener('input', () => {
        const pOv = getOrCreateAssigneeOverride(state.selectedAssignee);
        pOv.unavailableDays = Number(ptoSlider.value);
        state.copiedPromptNotice = false;
        recomputeSimulation();
        renderCockpit('person-pto-slider-input');
      });
      ptoSlider.addEventListener('change', () => {
        renderCockpit();
      });
    }

    document.querySelectorAll<HTMLButtonElement>('[data-preset-pto]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pOv = getOrCreateAssigneeOverride(state.selectedAssignee);
        pOv.unavailableDays = Number(btn.getAttribute('data-preset-pto') ?? 0);
        state.copiedPromptNotice = false;
        recomputeSimulation();
        renderCockpit();
      });
    });

    const btnPersonReassign = document.getElementById('btn-person-reassign');
    if (btnPersonReassign) {
      btnPersonReassign.addEventListener('click', () => {
        const pOv = getOrCreateAssigneeOverride(state.selectedAssignee);
        pOv.reassignBottleneck = !pOv.reassignBottleneck;
        state.copiedPromptNotice = false;
        recomputeSimulation();
        renderCockpit();
      });
    }

    const btnPersonSerialize = document.getElementById('btn-person-serialize');
    if (btnPersonSerialize) {
      btnPersonSerialize.addEventListener('click', () => {
        const pOv = getOrCreateAssigneeOverride(state.selectedAssignee);
        pOv.serializeParallelWork = !pOv.serializeParallelWork;
        state.copiedPromptNotice = false;
        recomputeSimulation();
        renderCockpit();
      });
    }

    const btnPersonPair = document.getElementById('btn-person-pair');
    if (btnPersonPair) {
      btnPersonPair.addEventListener('click', () => {
        const pOv = getOrCreateAssigneeOverride(state.selectedAssignee);
        pOv.pairOnTopBlocker = !pOv.pairOnTopBlocker;
        state.copiedPromptNotice = false;
        recomputeSimulation();
        renderCockpit();
      });
    }
  }

  if (skipMountForSlider !== 'time-machine-range') {
    // 7. Time Machine Epoch Buttons
    document.querySelectorAll<HTMLButtonElement>('[data-epoch-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-epoch-idx') ?? 2);
        state.selectedEpochIndex = idx;
        const ep = state.activeSim.timeMachineEpochs[idx];
        if (ep) {
          state.scrubberDayOffset = ep.dayOffset;
        }
        renderCockpit();
      });
    });

    // 8. Time Machine Continuous Range Slider
    const tmSlider = document.getElementById(
      'time-machine-range'
    ) as HTMLInputElement | null;
    if (tmSlider) {
      tmSlider.addEventListener('input', () => {
        const val = Number(tmSlider.value);
        state.scrubberDayOffset = val;
        let bestIdx = 0;
        let bestDist = Infinity;
        state.activeSim.timeMachineEpochs.forEach((ep, idx) => {
          const d = Math.abs(ep.dayOffset - val);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = idx;
          }
        });
        state.selectedEpochIndex = bestIdx;
        renderCockpit('time-machine-range');
      });
      tmSlider.addEventListener('change', () => {
        renderCockpit();
      });
    }
  }

  // 9. Header Action: Sync Jira Project (`invoke('getGraphData')`)
  const btnSyncJira = document.getElementById('btn-sync-jira');
  if (btnSyncJira) {
    btnSyncJira.addEventListener('click', async () => {
      state.statusBanner = `Syncing live issues from Jira project ${state.graph.projectKey}…`;
      renderCockpit();
      await loadJiraProjectGraph(state.graph.projectKey);
    });
  }

  // 10. Header Action: Add Sample Issues (`invoke('createRealJiraIssues')`)
  const btnCreateIssues = document.getElementById('btn-create-jira-issues');
  if (btnCreateIssues) {
    btnCreateIssues.addEventListener('click', async () => {
      state.statusBanner = `Creating linked issues in Jira project ${state.graph.projectKey} via REST API…`;
      renderCockpit();
      const res = await invokeForgeResolver<{
        seedReport?: { message?: string };
        graph?: CausalGraph;
      }>('createRealJiraIssues', { projectKey: state.graph.projectKey });
      if (res?.graph && res.graph.nodes.length >= 1) {
        state.graph = res.graph;
        state.selectedNodeKey = res.graph.nodes[0].key;
        recomputeSimulation();
      }
      state.statusBanner =
        res?.seedReport?.message ??
        `Synced issues for project ${state.graph.projectKey}.`;
      renderCockpit();
    });
  }

  // 11. Header Action: Focus Blocker
  const btnBottleneck = document.getElementById('btn-jump-bottleneck');
  if (btnBottleneck) {
    btnBottleneck.addEventListener('click', () => {
      const topKey =
        state.activeSim.topBottlenecks[0]?.key ??
        state.graph.nodes[0]?.key ??
        'BLP-7';
      switchSelectedIssue(topKey);
      state.simulatorMode = 'issue';
      if (state.delayDays === 0) state.delayDays = 5;
      syncCurrentNodeToPinIfPinned();
      recomputeSimulation();
      state.statusBanner = `Focused #1 Critical Blocker (${topKey}) — simulating a +${state.delayDays} day delay.`;
      renderCockpit();
      scrollDagToSelectedNode(true);
    });
  }

  // 12. Header Action: Reset (`invoke('resetScenario')`)
  const btnReset = document.getElementById('btn-reset-sim');
  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      state.delayDays = 0;
      state.addDeveloper = false;
      state.decoupleBlockingEdges = false;
      state.trimScope = false;
      state.pinnedNodeOverrides = {};
      state.assigneeOverrides = {};
      state.scrubberDayOffset = 0;
      state.selectedEpochIndex = 2;
      recomputeSimulation();
      state.statusBanner =
        'What-If changes cleared — viewing baseline schedule for ' + state.graph.projectName + '.';
      renderCockpit();
      await invokeForgeResolver('resetScenario', { projectKey: state.graph.projectKey });
    });
  }

  // 15. Reset Layout button (`⇄ Reset Layout`)
  const btnResetLayout = document.getElementById('btn-reset-layout');
  if (btnResetLayout) {
    btnResetLayout.addEventListener('click', () => {
      state.columnOrder = [...DEFAULT_COLUMN_ORDER];
      state.centerOrder = [...DEFAULT_CENTER_ORDER];
      persistSavedLayout(state.columnOrder, state.centerOrder);
      state.statusBanner = 'Restored default 3-column cockpit layout.';
      renderCockpit();
    });
  }

  // 16. Drag & Drop Panel Arrangement (guarded against duplicate binding during slider drags)
  const shellEl = document.querySelector<HTMLElement>('.cockpit-shell');

  document.querySelectorAll<HTMLButtonElement>('[data-drag-panel]').forEach((handle) => {
    if (handle.dataset.dndBound === '1') return;
    handle.dataset.dndBound = '1';

    handle.addEventListener('dragstart', (event: DragEvent) => {
      const panelId = handle.getAttribute('data-drag-panel') as DraggablePanelId | null;
      if (!panelId) return;
      activeDraggedPanel = panelId;
      didDragDuringPress = true;

      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', panelId);
        const ownerZone = handle.closest<HTMLElement>('[data-drop-zone]');
        if (ownerZone && typeof event.dataTransfer.setDragImage === 'function') {
          event.dataTransfer.setDragImage(ownerZone, 40, 24);
        }
      }

      handle.closest<HTMLElement>('[data-drop-zone]')?.classList.add('is-dragging-source');
      shellEl?.classList.add('cockpit-dragging-active');
    });

    handle.addEventListener('dragend', () => {
      activeDraggedPanel = null;
      setTimeout(() => {
        didDragDuringPress = false;
      }, 60);
      shellEl?.classList.remove('cockpit-dragging-active');
      document
        .querySelectorAll('.is-dragging-source, .is-drop-target-hover')
        .forEach((el) => el.classList.remove('is-dragging-source', 'is-drop-target-hover'));
    });

    // Click fallback: quick-swap side columns or vertical center cards with 1 click
    handle.addEventListener('click', (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (didDragDuringPress) return;
      const panelId = handle.getAttribute('data-drag-panel') as DraggablePanelId | null;
      if (!panelId) return;
      if (panelId === 'left-rail') {
        swapPanels('left-rail', 'scenario');
      } else if (panelId === 'scenario') {
        swapPanels('scenario', 'left-rail');
      } else if (panelId === 'dag') {
        swapPanels('dag', 'scrubber');
      } else if (panelId === 'scrubber') {
        swapPanels('scrubber', 'dag');
      }
    });
  });

  document.querySelectorAll<HTMLElement>('[data-drop-zone]').forEach((zone) => {
    if (zone.dataset.dndBound === '1') return;
    zone.dataset.dndBound = '1';

    zone.addEventListener('dragover', (event: DragEvent) => {
      const targetPanel = zone.getAttribute('data-drop-zone') as DraggablePanelId | null;
      const sourcePanel =
        activeDraggedPanel ||
        (event.dataTransfer?.getData('text/plain') as DraggablePanelId | '');
      if (!targetPanel || !sourcePanel || sourcePanel === targetPanel) return;

      const isVerticalCenterPair =
        (sourcePanel === 'dag' && targetPanel === 'scrubber') ||
        (sourcePanel === 'scrubber' && targetPanel === 'dag');
      if (!isVerticalCenterPair && toColumnSlot(sourcePanel) === toColumnSlot(targetPanel)) {
        return;
      }

      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
      zone.classList.add('is-drop-target-hover');
    });

    zone.addEventListener('dragleave', (event: DragEvent) => {
      const related = event.relatedTarget as Node | null;
      if (!related || !zone.contains(related)) {
        zone.classList.remove('is-drop-target-hover');
      }
    });

    zone.addEventListener('drop', (event: DragEvent) => {
      event.preventDefault();
      zone.classList.remove('is-drop-target-hover');
      const targetPanel = zone.getAttribute('data-drop-zone') as DraggablePanelId | null;
      const sourcePanel =
        activeDraggedPanel ||
        (event.dataTransfer?.getData('text/plain') as DraggablePanelId | '');
      activeDraggedPanel = null;
      shellEl?.classList.remove('cockpit-dragging-active');
      if (targetPanel && sourcePanel) {
        swapPanels(sourcePanel, targetPanel);
      }
    });
  });
}

// Global [ and ] keyboard stepping across issues in the Dependency Map (attached once)
document.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const activeEl = document.activeElement as HTMLElement | null;
  const tag = activeEl?.tagName?.toUpperCase();
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || activeEl?.isContentEditable) {
    return;
  }
  if (event.key !== '[' && event.key !== ']') return;

  const order =
    state.graph.topologicalOrder.length > 0
      ? state.graph.topologicalOrder
      : state.graph.nodes.map((n) => n.key);
  if (order.length === 0) return;

  const curIdx = order.indexOf(state.selectedNodeKey);
  const step = event.key === '[' ? -1 : 1;
  const nextIdx =
    curIdx < 0 ? 0 : (curIdx + step + order.length) % order.length;
  const nextKey = order[nextIdx];
  if (!nextKey || nextKey === state.selectedNodeKey) return;

  switchSelectedIssue(nextKey);
  state.simulatorMode = 'issue';
  recomputeSimulation();
  renderCockpit();
  scrollDagToSelectedNode(true);
});

// Initialize on DOM load + sync with Forge Backend Resolver (`getGraphData`)
document.addEventListener('DOMContentLoaded', async () => {
  renderCockpit();
  await loadJiraProjectGraph();
});
