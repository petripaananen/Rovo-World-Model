/**
 * Rovo-World-Model — Main Forge Entrypoint (`src/index.ts`)
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
import {
  AssigneeInterventionOverride,
  NodeInterventionOverride,
} from './engine/types';
import { MCP_TOOLS_MANIFEST, mcpWebtriggerHandler } from './mcp/server';
import {
  analyzeCriticalPath,
  analyzeCriticalPathHandler,
  seedDemoScenario,
  seedDemoScenarioHandler,
  simulateDelayImpact,
  simulateDelayImpactHandler,
} from './rovo/actions';
import {
  fetchAvailableJiraProjects,
  fetchProjectCausalGraph,
} from './twg/graphFetcher';
import { seedJiraProject, seedProjectChronosScenario } from './twg/syntheticSeeder';

const resolver = new Resolver();

function extractProjectKey(req: unknown, payloadProjectKey?: string): string | undefined {
  if (payloadProjectKey && payloadProjectKey.trim().length > 0) {
    return payloadProjectKey.trim().toUpperCase();
  }
  const ctx = (req as { context?: { extension?: { project?: { key?: string } } } })?.context;
  return ctx?.extension?.project?.key;
}

function extractCloudId(req: unknown): string | undefined {
  const ctx = (req as { context?: { cloudId?: string } })?.context;
  return ctx?.cloudId && ctx.cloudId.trim().length > 0 ? ctx.cloudId.trim() : undefined;
}

/**
 * 1. `getGraphData` / `getInitialWorldModel` — Loads available Jira projects, the active project's
 *    `CausalGraph`, and baseline 500-iteration Monte Carlo simulation.
 */
async function handleGetGraphData(req: { payload?: unknown; context?: unknown }) {
  const payload = (req?.payload ?? {}) as {
    projectKey?: string;
    forceDemo?: boolean;
  };
  const projectKey = extractProjectKey(req, payload.projectKey);
  const cloudId = extractCloudId(req);
  const availableProjects = await fetchAvailableJiraProjects();

  const graph = await fetchProjectCausalGraph({
    projectKey,
    cloudId,
    forceDemo: payload.forceDemo,
  });

  const baselineSimulation = runMonteCarloSimulation(graph, { iterations: 500 });

  return {
    availableProjects,
    graph,
    simulation: baselineSimulation,
    mcpTools: MCP_TOOLS_MANIFEST,
  };
}

resolver.define('getGraphData', handleGetGraphData);
resolver.define('getInitialWorldModel', handleGetGraphData);

/**
 * 2. `runWhatIfSimulation` / `simulateIntervention` — Runs counterfactual simulation
 *    supporting `deltaDays` (-5 to +30), `addDeveloper`, and `decoupleBlockingEdges`.
 */
async function handleRunWhatIfSimulation(req: { payload?: unknown; context?: unknown }) {
  const payload = (req?.payload ?? {}) as {
    projectKey?: string;
    targetNodeId: string;
    deltaDays: number;
    addDeveloper?: boolean;
    decoupleBlockingEdges?: boolean;
    trimScope?: boolean;
    nodeOverrides?: Record<string, NodeInterventionOverride>;
    assigneeOverrides?: Record<string, AssigneeInterventionOverride>;
    forceDemo?: boolean;
  };
  const projectKey = extractProjectKey(req, payload.projectKey);
  const cloudId = extractCloudId(req);

  const graph = await fetchProjectCausalGraph({
    projectKey,
    cloudId,
    forceDemo: payload.forceDemo,
  });

  const targetNodeId =
    payload.targetNodeId || graph.topologicalOrder[0] || graph.nodes[0]?.key || 'BLP-7';
  const deltaDays = Number(payload.deltaDays ?? 0);
  const addDeveloper = Boolean(payload.addDeveloper);
  const decoupleBlockingEdges = Boolean(payload.decoupleBlockingEdges);
  const trimScope = Boolean(payload.trimScope);
  const hasNodeOverrides = Boolean(
    payload.nodeOverrides && Object.keys(payload.nodeOverrides).length > 0
  );
  const hasAssigneeOverrides = Boolean(
    payload.assigneeOverrides && Object.keys(payload.assigneeOverrides).length > 0
  );

  if (
    deltaDays === 0 &&
    !addDeveloper &&
    !decoupleBlockingEdges &&
    !trimScope &&
    !hasNodeOverrides &&
    !hasAssigneeOverrides
  ) {
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
    trimScope,
    nodeOverrides: payload.nodeOverrides,
    assigneeOverrides: payload.assigneeOverrides,
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
 * 3. `loadDemoScenario` / `seedDemoScenario` — Optional Demo Scenario loader if explicitly requested.
 */
async function handleLoadDemoScenario(req: { payload?: unknown; context?: unknown }) {
  const payload = (req?.payload ?? {}) as {
    projectKey?: string;
    populateJiraIssues?: boolean;
  };
  const projectKey = extractProjectKey(req, payload.projectKey) || 'BLP';

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
 * 4. `createRealJiraIssues` — Uses `seedJiraProject(projectKey)` to create real linked issues via Jira REST API,
 *    then reloads the live Jira project graph.
 */
resolver.define('createRealJiraIssues', async (req) => {
  const payload = (req?.payload ?? {}) as { projectKey?: string };
  const projectKey = extractProjectKey(req, payload.projectKey) || 'BLP';
  const cloudId = extractCloudId(req);
  const seedReport = await seedJiraProject(projectKey);
  const liveGraph = await fetchProjectCausalGraph({ projectKey, cloudId });
  const baselineSimulation = runMonteCarloSimulation(liveGraph, { iterations: 500 });
  return {
    seedReport,
    graph: liveGraph,
    simulation: baselineSimulation,
  };
});

/**
 * 5. `resetScenario` — Resets counterfactual interventions and returns the clean baseline simulation.
 */
resolver.define('resetScenario', async (req) => {
  const payload = (req?.payload ?? {}) as { projectKey?: string; forceDemo?: boolean };
  const projectKey = extractProjectKey(req, payload.projectKey);
  const cloudId = extractCloudId(req);
  const graph = await fetchProjectCausalGraph({
    projectKey,
    cloudId,
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
    trimScope?: boolean;
    nodeOverrides?: Record<string, NodeInterventionOverride>;
    assigneeOverrides?: Record<string, AssigneeInterventionOverride>;
    projectKey?: string;
    populateJiraIssues?: boolean;
  };

  if (payload.actionKey === 'simulate-delay-impact') {
    return simulateDelayImpact({
      issueKey: payload.issueKey,
      delayDays: payload.delayDays,
      addDeveloper: payload.addDeveloper,
      decoupleBlockingEdges: payload.decoupleBlockingEdges,
      trimScope: payload.trimScope,
      nodeOverrides: payload.nodeOverrides,
      assigneeOverrides: payload.assigneeOverrides,
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
