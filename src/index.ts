/**
 * Project World Model (PWM) & Jira Time Machine — Main Forge Entrypoint (`src/index.ts`)
 *
 * Exports:
 * - `uiResolverHandler`: `@forge/resolver` handler for the `jira:projectPage` Custom UI Cockpit
 *   Resolvers: `getGraphData`, `runWhatIfSimulation`, `loadDemoScenario`, `resetScenario`,
 *              `createRealJiraIssues`, `getInitialWorldModel`, `simulateIntervention`, `seedDemoScenario`
 * - `simulateDelayImpact` / `simulateDelayImpactHandler`: Rovo Action `simulate-delay-impact`
 * - `analyzeCriticalPath` / `analyzeCriticalPathHandler`: Rovo Action `analyze-critical-path`
 * - `seedDemoScenario` / `seedDemoScenarioHandler`: Rovo Action `seed-demo-scenario`
 * - `mcpWebtriggerHandler`: MCP JSON-RPC 2.0 Webtrigger `mcp-world-model-endpoint`
 */

import Resolver from '@forge/resolver';
import { runIntervention, runMonteCarloSimulation } from './engine/simulator';
import { MCP_TOOLS_MANIFEST, mcpWebtriggerHandler } from './mcp/server';
import {
  analyzeCriticalPath,
  analyzeCriticalPathHandler,
  seedDemoScenario,
  seedDemoScenarioHandler,
  simulateDelayImpact,
  simulateDelayImpactHandler,
} from './rovo/actions';
import { fetchProjectCausalGraph } from './twg/graphFetcher';
import { seedJiraProject, seedProjectChronosScenario } from './twg/syntheticSeeder';

const resolver = new Resolver();

function extractProjectKey(req: unknown, payloadProjectKey?: string): string {
  if (payloadProjectKey) return payloadProjectKey;
  const ctx = (req as { context?: { extension?: { project?: { key?: string } } } })?.context;
  return ctx?.extension?.project?.key || 'CHRON';
}

/**
 * 1. `getGraphData` / `getInitialWorldModel` — Loads the CausalGraph and baseline 500-iteration Monte Carlo simulation.
 */
async function handleGetGraphData(req: { payload?: unknown; context?: unknown }) {
  const payload = (req?.payload ?? {}) as {
    projectKey?: string;
    forceDemo?: boolean;
  };
  const projectKey = extractProjectKey(req, payload.projectKey);

  const graph = await fetchProjectCausalGraph({
    projectKey,
    forceDemo: payload.forceDemo,
  });

  const baselineSimulation = runMonteCarloSimulation(graph, { iterations: 500 });

  return {
    graph,
    simulation: baselineSimulation,
    mcpTools: MCP_TOOLS_MANIFEST,
  };
}

resolver.define('getGraphData', handleGetGraphData);
resolver.define('getInitialWorldModel', handleGetGraphData);

/**
 * 2. `runWhatIfSimulation` / `simulateIntervention` — Runs $do(\text{targetNodeId})$ counterfactual simulation
 * supporting `deltaDays` (-5 to +30), `addDeveloper`, and `decoupleBlockingEdges`.
 */
async function handleRunWhatIfSimulation(req: { payload?: unknown; context?: unknown }) {
  const payload = (req?.payload ?? {}) as {
    projectKey?: string;
    targetNodeId: string;
    deltaDays: number;
    addDeveloper?: boolean;
    decoupleBlockingEdges?: boolean;
    forceDemo?: boolean;
  };
  const projectKey = extractProjectKey(req, payload.projectKey);

  const graph = await fetchProjectCausalGraph({
    projectKey,
    forceDemo: payload.forceDemo,
  });

  const targetNodeId =
    payload.targetNodeId || graph.topologicalOrder[3] || graph.nodes[0]?.key || 'CHRON-104';
  const deltaDays = Number(payload.deltaDays ?? 0);
  const addDeveloper = Boolean(payload.addDeveloper);
  const decoupleBlockingEdges = Boolean(payload.decoupleBlockingEdges);

  if (deltaDays === 0 && !addDeveloper && !decoupleBlockingEdges) {
    const baseline = runMonteCarloSimulation(graph, { iterations: 500 });
    return {
      graph,
      simulation: baseline,
      intervention: null,
    };
  }

  const intervention = runIntervention(graph, targetNodeId, deltaDays, {
    iterations: 500,
    addDeveloper,
    decoupleBlockingEdges,
  });

  return {
    graph,
    simulation: intervention,
    intervention,
  };
}

resolver.define('runWhatIfSimulation', handleRunWhatIfSimulation);
resolver.define('simulateIntervention', handleRunWhatIfSimulation);

/**
 * 3. `loadDemoScenario` / `seedDemoScenario` — One-click Judge Demo Scenario loader ("Project Chronos: Next-Gen Platform Launch").
 */
async function handleLoadDemoScenario(req: { payload?: unknown; context?: unknown }) {
  const payload = (req?.payload ?? {}) as {
    projectKey?: string;
    populateJiraIssues?: boolean;
  };
  const projectKey = extractProjectKey(req, payload.projectKey);

  const seedReport = await seedProjectChronosScenario({
    projectKey,
    populateJiraIssues: Boolean(payload.populateJiraIssues),
  });

  const baselineSimulation = runMonteCarloSimulation(seedReport.graph, { iterations: 500 });

  return {
    seedReport,
    graph: seedReport.graph,
    simulation: baselineSimulation,
  };
}

resolver.define('loadDemoScenario', handleLoadDemoScenario);
resolver.define('seedDemoScenario', handleLoadDemoScenario);

/**
 * 4. `createRealJiraIssues` — Uses `seedJiraProject(projectKey)` to create real linked demo issues via Jira REST API.
 */
resolver.define('createRealJiraIssues', async (req) => {
  const payload = (req?.payload ?? {}) as { projectKey?: string };
  const projectKey = extractProjectKey(req, payload.projectKey);
  const seedReport = await seedJiraProject(projectKey);
  const baselineSimulation = runMonteCarloSimulation(seedReport.graph, { iterations: 500 });
  return {
    seedReport,
    graph: seedReport.graph,
    simulation: baselineSimulation,
  };
});

/**
 * 5. `resetScenario` — Resets counterfactual interventions and returns the clean baseline simulation.
 */
resolver.define('resetScenario', async (req) => {
  const payload = (req?.payload ?? {}) as { projectKey?: string; forceDemo?: boolean };
  const projectKey = extractProjectKey(req, payload.projectKey);
  const graph = await fetchProjectCausalGraph({
    projectKey,
    forceDemo: payload.forceDemo,
  });
  const baselineSimulation = runMonteCarloSimulation(graph, { iterations: 500 });
  return {
    graph,
    simulation: baselineSimulation,
    intervention: null,
  };
});

/**
 * 6. `invokeRovoOrMcpAction` — Allows the Custom UI Cockpit to test Rovo Actions & MCP Tools live.
 */
resolver.define('invokeRovoOrMcpAction', async (req) => {
  const payload = (req?.payload ?? {}) as {
    actionKey: string;
    issueKey?: string;
    delayDays?: number;
    addDeveloper?: boolean;
    decoupleBlockingEdges?: boolean;
    projectKey?: string;
    populateJiraIssues?: boolean;
  };

  if (payload.actionKey === 'simulate-delay-impact') {
    return simulateDelayImpact({
      issueKey: payload.issueKey,
      delayDays: payload.delayDays,
      addDeveloper: payload.addDeveloper,
      decoupleBlockingEdges: payload.decoupleBlockingEdges,
      projectKey: payload.projectKey,
    });
  }
  if (payload.actionKey === 'analyze-critical-path') {
    return analyzeCriticalPath({
      projectKey: payload.projectKey,
    });
  }
  if (payload.actionKey === 'seed-demo-scenario') {
    return seedDemoScenario({
      projectKey: payload.projectKey,
      populateJiraIssues: payload.populateJiraIssues,
    });
  }

  return { error: `Unknown actionKey: ${payload.actionKey}` };
});

export const uiResolverHandler = resolver.getDefinitions();

export {
  simulateDelayImpact,
  analyzeCriticalPath,
  seedDemoScenario,
  simulateDelayImpactHandler,
  analyzeCriticalPathHandler,
  seedDemoScenarioHandler,
  mcpWebtriggerHandler,
};
