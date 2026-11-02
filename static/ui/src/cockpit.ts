/**
 * Rovo-World-Model — Main Custom UI Cockpit Controller (`static/ui/src/cockpit.ts`)
 *
 * Uses Atlassian Forge's `window.__bridge.callBridge('invoke', ...)` to load real Jira projects
 * (e.g., `BloomPath Sprint (BLP)`, `Triton (TRI)`) and their live issues directly from Jira Cloud.
 */

import { buildDAGFromJiraIssues } from '../../../src/engine/dag';
import { runIntervention, runMonteCarloSimulation } from '../../../src/engine/simulator';
import {
  CausalGraph,
  InterventionResult,
  SimulationResult,
} from '../../../src/engine/types';
import { renderDagCanvas } from './components/DagCanvas';
import { JiraProjectOption, renderHeaderBar } from './components/HeaderBar';
import {
  buildRovoMitigationPrompt,
  renderScenarioPanel,
} from './components/ScenarioPanel';
import { renderTimelineScrubber } from './components/TimelineScrubber';
import { escapeHtmlText } from './components/tooltip';

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
  selectedEpochIndex: number;
  scrubberDayOffset: number;
  activeRightTab: 'cascade' | 'bottlenecks' | 'rovo-mcp';
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
        targetDate: '2026-11-18',
        targetDayOffset: 18,
        ownerTeam: `${projectName} Engineering`,
        status: 'On Track',
      },
      {
        id: 'GOAL-OMEGA',
        key: `${projectKey}-GOAL-2`,
        name: `${projectName} Release Milestone`,
        targetDate: '2026-12-02',
        targetDayOffset: 32,
        ownerTeam: `${projectName} Engineering`,
        status: 'On Track',
      },
    ],
    [
      {
        id: 'team-1',
        name: `${projectName} Engineering`,
        lead: 'Petri Paananen',
        color: '#0C66E4',
        cognitiveLoad: 65,
      },
    ],
    '2026-10-30'
  );

  return {
    ...dag,
    projectName,
    isSyntheticDemo: false,
  };
}

const initialGraph = createInitialRealProjectGraph('BLP', 'BloomPath Sprint');
const initialBaseline = runMonteCarloSimulation(initialGraph, { iterations: 500 });

const state: CockpitState = {
  availableProjects: [
    { id: 'BLP', key: 'BLP', name: 'BloomPath Sprint' },
    { id: 'TRI', key: 'TRI', name: 'Triton' },
  ],
  graph: initialGraph,
  baselineSim: initialBaseline,
  activeSim: initialBaseline,
  intervention: null,
  selectedNodeKey: initialGraph.nodes[0]?.key ?? 'BLP-7',
  delayDays: 0,
  addDeveloper: false,
  decoupleBlockingEdges: false,
  selectedEpochIndex: 2, // Today
  scrubberDayOffset: 0,
  activeRightTab: 'cascade',
  copiedPromptNotice: false,
  statusBanner:
    'Connected to Jira project — Click any issue card or drag the Schedule Change slider to simulate timeline impacts.',
};

function recomputeSimulation(): void {
  state.baselineSim = runMonteCarloSimulation(state.graph, { iterations: 500 });
  const hasIntervention =
    state.delayDays !== 0 || state.addDeveloper || state.decoupleBlockingEdges;

  if (hasIntervention && state.selectedNodeKey) {
    const intResult = runIntervention(
      state.graph,
      state.selectedNodeKey,
      state.delayDays,
      {
        iterations: 500,
        addDeveloper: state.addDeveloper,
        decoupleBlockingEdges: state.decoupleBlockingEdges,
      }
    );
    state.intervention = intResult;
    state.activeSim = intResult;
  } else {
    state.intervention = null;
    state.activeSim = state.baselineSim;
  }
}

export function renderCockpit(
  activeSliderId?: 'delay-slider-input' | 'time-machine-range'
): void {
  const root = document.getElementById('app-root');
  if (!root) return;

  const hasActiveIntervention =
    state.delayDays !== 0 || state.addDeveloper || state.decoupleBlockingEdges;

  const headerHtml = renderHeaderBar({
    availableProjects: state.availableProjects,
    graph: state.graph,
    baselineSim: state.baselineSim,
    activeSim: state.activeSim,
    intervention: state.intervention,
    selectedNodeKey: state.selectedNodeKey,
    delayDays: state.delayDays,
    addDeveloper: state.addDeveloper,
    decoupleBlockingEdges: state.decoupleBlockingEdges,
    statusBanner: state.statusBanner,
  });

  const scrubberHtml = renderTimelineScrubber({
    graph: state.graph,
    activeSim: state.activeSim,
    selectedEpochIndex: state.selectedEpochIndex,
    scrubberDayOffset: state.scrubberDayOffset,
    hasActiveIntervention,
  });

  const dagHtml = renderDagCanvas({
    graph: state.graph,
    activeSim: state.activeSim,
    selectedNodeKey: state.selectedNodeKey,
    delayDays: state.delayDays,
    addDeveloper: state.addDeveloper,
    decoupleBlockingEdges: state.decoupleBlockingEdges,
    scrubberDayOffset: state.scrubberDayOffset,
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
    activeRightTab: state.activeRightTab,
    copiedPromptNotice: state.copiedPromptNotice,
  });

  const headerMount = document.getElementById('header-mount');
  const scrubberMount = document.getElementById('scrubber-mount');
  const dagMount = document.getElementById('dag-mount');
  const scenarioMount = document.getElementById('scenario-mount');

  if (activeSliderId && headerMount && scrubberMount && dagMount && scenarioMount) {
    headerMount.innerHTML = headerHtml;
    dagMount.innerHTML = dagHtml;
    if (activeSliderId === 'delay-slider-input') {
      scrubberMount.innerHTML = scrubberHtml;
      const readoutEl = scenarioMount.querySelector('.slider-value-readout');
      if (readoutEl) {
        readoutEl.textContent =
          state.delayDays > 0
            ? `+${state.delayDays} Days (Delayed)`
            : state.delayDays < 0
              ? `${state.delayDays} Days (Accelerated)`
              : '0 Days (Baseline)';
        readoutEl.className = `slider-value-readout ${
          state.delayDays > 0
            ? 'delay-positive'
            : state.delayDays < 0
              ? 'delay-negative'
              : 'delay-zero'
        }`;
      }
      scenarioMount
        .querySelectorAll<HTMLButtonElement>('[data-preset-delay]')
        .forEach((btn) => {
          const d = Number(btn.getAttribute('data-preset-delay') ?? 0);
          btn.classList.toggle('active', d === state.delayDays);
        });
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

  root.innerHTML = `
    <div class="cockpit-shell">
      <div id="header-mount" style="display:contents">${headerHtml}</div>
      <div id="scrubber-mount" style="display:contents">${scrubberHtml}</div>
      <section class="workspace-grid">
        <div id="dag-mount" style="display:contents">${dagHtml}</div>
        <div id="scenario-mount" style="display:contents">${scenarioHtml}</div>
      </section>
    </div>
  `;

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
    recomputeSimulation();
    renderCockpit();
  }
}

function attachCockpitEventListeners(
  skipMountForSlider?: 'delay-slider-input' | 'time-machine-range'
): void {
  const triggerRemoteWhatIf = () => {
    void invokeForgeResolver('runWhatIfSimulation', {
      projectKey: state.graph.projectKey,
      targetNodeId: state.selectedNodeKey,
      deltaDays: state.delayDays,
      addDeveloper: state.addDeveloper,
      decoupleBlockingEdges: state.decoupleBlockingEdges,
    });
  };

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

  // 1. Node click + hover inspector on SVG DAG
  const hoverCard = document.getElementById('dag-node-hover-card');
  const viewportContainer = document.getElementById('dag-viewport-container');

  document.querySelectorAll<SVGGElement>('.dag-node-group').forEach((el) => {
    el.addEventListener('click', () => {
      const key = el.getAttribute('data-node-key');
      if (key) {
        state.selectedNodeKey = key;
        state.copiedPromptNotice = false;
        recomputeSimulation();
        triggerRemoteWhatIf();
        renderCockpit();
      }
    });

    el.addEventListener('mouseenter', (evt) => {
      if (!hoverCard || !viewportContainer) return;
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
          goalName: string;
          p85Date: string;
          rippleShift: number;
          criticalityPct: number;
          adr: string;
        };

        const shiftLine =
          info.rippleShift > 0
            ? `<span style="color:#AE2E24;font-weight:700;">+${info.rippleShift.toFixed(1)}d downstream slip</span>`
            : info.rippleShift < 0
              ? `<span style="color:#216E4E;font-weight:700;">${info.rippleShift.toFixed(1)}d faster</span>`
              : `<span style="color:#626F86;">On Baseline Schedule</span>`;

        hoverCard.innerHTML = `
          <div class="hover-card-header">
            <span class="hover-card-key">${escapeHtmlText(info.key)}</span>
            <span class="jira-lozenge jira-lozenge-todo">${escapeHtmlText(info.status.toUpperCase())}</span>
          </div>
          <div class="hover-card-title">${escapeHtmlText(info.summary)}</div>
          <div class="hover-card-meta">
            <div><span>Assignee:</span> <strong>${escapeHtmlText(info.assignee)}</strong></div>
            <div><span>Projected Finish:</span> <strong>${escapeHtmlText(info.p85Date)}</strong></div>
            <div><span>Schedule Impact:</span> ${shiftLine}</div>
            <div><span>Linked Goal:</span> <strong>${escapeHtmlText(info.goalName)}</strong></div>
          </div>
          ${
            info.adr
              ? `<div class="hover-card-adr">📄 ${escapeHtmlText(info.adr)}</div>`
              : ''
          }
          <div class="hover-card-math">
            📐 <code>Est = ${info.estimateDays}d (σ = ±${info.sigma}d) | Criticality = ${info.criticalityPct}%</code>
          </div>
          <div class="hover-card-tip">Click issue card to select &amp; simulate</div>
        `;
        hoverCard.style.display = 'block';

        const vpRect = viewportContainer.getBoundingClientRect();
        const mouseX = evt.clientX - vpRect.left + viewportContainer.scrollLeft;
        const mouseY = evt.clientY - vpRect.top + viewportContainer.scrollTop;

        const leftPos = Math.min(
          Math.max(12, mouseX + 16),
          viewportContainer.scrollWidth - 310
        );
        const topPos = Math.max(12, mouseY - 24);
        hoverCard.style.left = `${leftPos}px`;
        hoverCard.style.top = `${topPos}px`;
      } catch {
        // Ignore parse issues
      }
    });

    el.addEventListener('mouseleave', () => {
      if (hoverCard) {
        hoverCard.style.display = 'none';
      }
    });
  });

  if (skipMountForSlider !== 'delay-slider-input') {
    // 2. Delay / Accelerate Slider input (-5d to +30d)
    const delaySlider = document.getElementById(
      'delay-slider-input'
    ) as HTMLInputElement | null;
    if (delaySlider) {
      delaySlider.addEventListener('input', () => {
        state.delayDays = Number(delaySlider.value);
        state.copiedPromptNotice = false;
        recomputeSimulation();
        renderCockpit('delay-slider-input');
      });
      delaySlider.addEventListener('change', () => {
        renderCockpit();
        triggerRemoteWhatIf();
      });
    }

    // 3. Delay / Accelerate Preset Buttons
    document.querySelectorAll<HTMLButtonElement>('[data-preset-delay]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.delayDays = Number(btn.getAttribute('data-preset-delay') ?? 0);
        state.copiedPromptNotice = false;
        recomputeSimulation();
        triggerRemoteWhatIf();
        renderCockpit();
      });
    });

    // 4. Scope / Resource Toggle: Add Developer
    const btnAddDev = document.getElementById('btn-toggle-add-dev');
    if (btnAddDev) {
      btnAddDev.addEventListener('click', () => {
        state.addDeveloper = !state.addDeveloper;
        state.copiedPromptNotice = false;
        recomputeSimulation();
        triggerRemoteWhatIf();
        renderCockpit();
      });
    }

    // 5. Scope / Resource Toggle: Decouple Dependency
    const btnDecouple = document.getElementById('btn-toggle-decouple-edge');
    if (btnDecouple) {
      btnDecouple.addEventListener('click', () => {
        state.decoupleBlockingEdges = !state.decoupleBlockingEdges;
        state.copiedPromptNotice = false;
        recomputeSimulation();
        triggerRemoteWhatIf();
        renderCockpit();
      });
    }

    // 6. Copy Rovo Mitigation Prompt Button
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
          state.selectedNodeKey = key;
          if (state.delayDays === 0) state.delayDays = 5;
          recomputeSimulation();
          renderCockpit();
        }
      });
    });
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
      state.selectedNodeKey = topKey;
      if (state.delayDays === 0) state.delayDays = 5;
      recomputeSimulation();
      state.statusBanner = `Focused #1 Critical Blocker (${topKey}) — simulating a +${state.delayDays} day delay.`;
      renderCockpit();
    });
  }

  // 12. Header Action: Reset (`invoke('resetScenario')`)
  const btnReset = document.getElementById('btn-reset-sim');
  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      state.delayDays = 0;
      state.addDeveloper = false;
      state.decoupleBlockingEdges = false;
      state.scrubberDayOffset = 0;
      state.selectedEpochIndex = 2;
      recomputeSimulation();
      state.statusBanner =
        'What-If changes cleared — viewing baseline schedule for ' + state.graph.projectName + '.';
      renderCockpit();
      await invokeForgeResolver('resetScenario', { projectKey: state.graph.projectKey });
    });
  }
}

// Initialize on DOM load + sync with Forge Backend Resolver (`getGraphData`)
document.addEventListener('DOMContentLoaded', async () => {
  renderCockpit();
  await loadJiraProjectGraph();
});
