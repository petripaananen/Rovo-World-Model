/**
 * Project World Model (PWM) × Jira Time Machine — Main Custom UI Cockpit Controller
 *
 * Composes:
 * 1. `HeaderBar.tsx` (`renderHeaderBar`)
 * 2. `TimelineScrubber.tsx` (`renderTimelineScrubber`)
 * 3. `DagCanvas.tsx` (`renderDagCanvas`)
 * 4. `ScenarioPanel.tsx` (`renderScenarioPanel`, `buildRovoMitigationPrompt`)
 *
 * Communicates with Atlassian Forge via `@forge/bridge` (`invoke`) for `getGraphData`,
 * `runWhatIfSimulation`, `loadDemoScenario`, `resetScenario`, and `createRealJiraIssues`,
 * with instant 500-iteration client-side CRN Monte Carlo computation for zero-latency interactivity.
 */

import { runIntervention, runMonteCarloSimulation } from '../../../src/engine/simulator';
import {
  CausalGraph,
  InterventionResult,
  SimulationResult,
} from '../../../src/engine/types';
import { getChronosSyntheticGraph } from '../../../src/twg/syntheticSeeder';
import { renderDagCanvas } from './components/DagCanvas';
import { renderHeaderBar } from './components/HeaderBar';
import {
  buildRovoMitigationPrompt,
  renderScenarioPanel,
} from './components/ScenarioPanel';
import { renderTimelineScrubber } from './components/TimelineScrubber';

interface CockpitState {
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
 * Helper to invoke Atlassian Forge Custom UI resolver (`@forge/bridge`) when running inside Jira Cloud,
 * with seamless local mock fallback during browser development.
 */
async function invokeForgeResolver<T>(
  functionKey: string,
  payload: Record<string, unknown> = {}
): Promise<T | null> {
  try {
    const win = window as unknown as {
      __forgeBridge?: { invoke?: (k: string, p?: unknown) => Promise<T> };
    };
    if (win.__forgeBridge && typeof win.__forgeBridge.invoke === 'function') {
      return await win.__forgeBridge.invoke(functionKey, payload);
    }
  } catch {
    // Fallback to local engine
  }
  return null;
}

const initialGraph = getChronosSyntheticGraph('CHRON');
const initialBaseline = runMonteCarloSimulation(initialGraph, { iterations: 500 });
const initialIntervention = runIntervention(initialGraph, 'CHRON-104', 8, {
  iterations: 500,
});

const state: CockpitState = {
  graph: initialGraph,
  baselineSim: initialBaseline,
  activeSim: initialIntervention,
  intervention: initialIntervention,
  selectedNodeKey: 'CHRON-104',
  delayDays: 8,
  addDeveloper: false,
  decoupleBlockingEdges: false,
  selectedEpochIndex: 2, // Today (State t_0)
  scrubberDayOffset: 0,
  activeRightTab: 'cascade',
  copiedPromptNotice: false,
  statusBanner:
    'Active Scenario: "Project Chronos: Next-Gen Platform Launch" (18 Nodes across Core Engine, Cloud Infra, Client UI · 2 TWG Goals: Zero-Downtime Migration & Q4 Global Launch)',
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

export function renderCockpit(): void {
  const root = document.getElementById('app-root');
  if (!root) return;

  const hasActiveIntervention =
    state.delayDays !== 0 || state.addDeveloper || state.decoupleBlockingEdges;

  root.innerHTML = `
    <div class="cockpit-shell">
      ${renderHeaderBar({
        graph: state.graph,
        baselineSim: state.baselineSim,
        activeSim: state.activeSim,
        intervention: state.intervention,
        selectedNodeKey: state.selectedNodeKey,
        delayDays: state.delayDays,
        addDeveloper: state.addDeveloper,
        decoupleBlockingEdges: state.decoupleBlockingEdges,
        statusBanner: state.statusBanner,
      })}

      ${renderTimelineScrubber({
        graph: state.graph,
        activeSim: state.activeSim,
        selectedEpochIndex: state.selectedEpochIndex,
        scrubberDayOffset: state.scrubberDayOffset,
        hasActiveIntervention,
      })}

      <section class="workspace-grid">
        ${renderDagCanvas({
          graph: state.graph,
          activeSim: state.activeSim,
          selectedNodeKey: state.selectedNodeKey,
          delayDays: state.delayDays,
          addDeveloper: state.addDeveloper,
          decoupleBlockingEdges: state.decoupleBlockingEdges,
          scrubberDayOffset: state.scrubberDayOffset,
        })}

        ${renderScenarioPanel({
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
        })}
      </section>
    </div>
  `;

  attachCockpitEventListeners();
}

function attachCockpitEventListeners(): void {
  const triggerRemoteWhatIf = () => {
    void invokeForgeResolver('runWhatIfSimulation', {
      targetNodeId: state.selectedNodeKey,
      deltaDays: state.delayDays,
      addDeveloper: state.addDeveloper,
      decoupleBlockingEdges: state.decoupleBlockingEdges,
    });
  };

  // 1. Node click on SVG DAG
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
  });

  // 2. Delay / Accelerate Slider input (-5d to +30d)
  const delaySlider = document.getElementById(
    'delay-slider-input'
  ) as HTMLInputElement | null;
  if (delaySlider) {
    delaySlider.addEventListener('input', () => {
      state.delayDays = Number(delaySlider.value);
      state.copiedPromptNotice = false;
      recomputeSimulation();
      renderCockpit();
    });
    delaySlider.addEventListener('change', () => {
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

  // 4. Scope / Resource Toggle: Add Developer (+1 Swarm Resource)
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

  // 5. Scope / Resource Toggle: Decouple Blocking Edge
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
      state.statusBanner = `Copied Rovo Mitigation Prompt: "${promptText.slice(0, 95)}…"`;
      renderCockpit();
    });
  }

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
      renderCockpit();
    });
  }

  // 9. Header Action: Load Demo Scenario (`invoke('loadDemoScenario')`)
  const btnLoadDemo = document.getElementById('btn-load-demo');
  if (btnLoadDemo) {
    btnLoadDemo.addEventListener('click', async () => {
      state.graph = getChronosSyntheticGraph('CHRON');
      state.selectedNodeKey = 'CHRON-104';
      state.delayDays = 10;
      state.addDeveloper = false;
      state.decoupleBlockingEdges = false;
      state.selectedEpochIndex = 2;
      state.scrubberDayOffset = 0;
      recomputeSimulation();
      state.statusBanner =
        'Loaded "Project Chronos: Next-Gen Platform Launch" (18 nodes across Core Engine, Cloud Infra, Client UI) with +10d shock on CHRON-104.';
      renderCockpit();
      await invokeForgeResolver('loadDemoScenario', { projectKey: 'CHRON' });
    });
  }

  // 10. Header Action: Create Real Jira Issues (`invoke('createRealJiraIssues')`)
  const btnCreateIssues = document.getElementById('btn-create-jira-issues');
  if (btnCreateIssues) {
    btnCreateIssues.addEventListener('click', async () => {
      state.statusBanner =
        'Executing seedJiraProject("CHRON") via api.asApp().requestJira(route`/rest/api/3/issue`)…';
      renderCockpit();
      const res = await invokeForgeResolver<{
        seedReport?: { message?: string };
      }>('createRealJiraIssues', { projectKey: state.graph.projectKey });
      state.statusBanner =
        res?.seedReport?.message ??
        'Project Chronos 18-node graph synced (in-memory snapshot active for local/sandbox environment).';
      renderCockpit();
    });
  }

  // 11. Header Action: Focus Top Bottleneck
  const btnBottleneck = document.getElementById('btn-jump-bottleneck');
  if (btnBottleneck) {
    btnBottleneck.addEventListener('click', () => {
      const topKey = state.activeSim.topBottlenecks[0]?.key ?? 'CHRON-104';
      state.selectedNodeKey = topKey;
      if (state.delayDays === 0) state.delayDays = 8;
      recomputeSimulation();
      state.statusBanner = `Focused #1 Critical Bottleneck ${topKey} — simulating +${state.delayDays}d counterfactual delay.`;
      renderCockpit();
    });
  }

  // 12. Header Action: Reset Scenario (`invoke('resetScenario')`)
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
        'Scenario reset — viewing unperturbed 500-iteration baseline forecast.';
      renderCockpit();
      await invokeForgeResolver('resetScenario', { projectKey: state.graph.projectKey });
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
        if (state.delayDays === 0) state.delayDays = 7;
        recomputeSimulation();
        renderCockpit();
      }
    });
  });
}

// Initialize on DOM load + sync with Forge Backend Resolver (`getGraphData`)
document.addEventListener('DOMContentLoaded', async () => {
  renderCockpit();
  const remoteData = await invokeForgeResolver<{
    graph?: CausalGraph;
    simulation?: SimulationResult;
  }>('getGraphData', {});
  if (remoteData?.graph && remoteData.graph.nodes?.length >= 5) {
    state.graph = remoteData.graph;
    state.selectedNodeKey =
      remoteData.graph.nodes.find((n) => n.key.endsWith('-104'))?.key ??
      remoteData.graph.topologicalOrder[3] ??
      remoteData.graph.nodes[0].key;
    recomputeSimulation();
    renderCockpit();
  }
});
