import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {
  buildDAGFromJiraIssues,
  computeDeterministicCriticalPath,
  detectAndBreakCycles,
  getDownstreamBlastRadius,
  resolveNodeKey,
  runIntervention,
  runMonteCarloSimulation,
  topologicalSort,
} from '../index';
import { getChronosSyntheticGraph, seedJiraProject } from '../../twg/syntheticSeeder';
import { fetchProjectCausalGraph } from '../../twg/graphFetcher';
import {
  analyzeCriticalPath,
  seedDemoScenario,
  simulateDelayImpact,
} from '../../rovo/actions';
import { mcpWebtriggerHandler } from '../../mcp/server';

describe('Project World Model (PWM) — Causal DAG & Monte Carlo Simulator', () => {
  it('constructs the 18-node Project Chronos: Next-Gen Platform Launch DAG across Core Engine, Cloud Infra, Client UI and 2 Goals', () => {
    const graph = getChronosSyntheticGraph('CHRON');
    assert.equal(graph.projectName, 'Project Chronos: Next-Gen Platform Launch');
    assert.equal(graph.isSyntheticDemo, true);
    assert.equal(graph.nodes.length, 18);
    assert.deepEqual(
      graph.teams.map((t) => t.name),
      ['Core Engine', 'Cloud Infra', 'Client UI']
    );
    assert.deepEqual(
      graph.goals.map((g) => g.name),
      ['Zero-Downtime Migration', 'Q4 Global Launch']
    );
    assert.equal(graph.cycleWarnings.length, 0);
    assert.equal(graph.topologicalOrder.length, 18);

    // Verify CORE-104 alias resolves to CHRON-104
    assert.equal(resolveNodeKey(graph.nodes, 'CORE-104'), 'CHRON-104');

    const position = new Map<string, number>();
    graph.topologicalOrder.forEach((key, idx) => position.set(key, idx));
    for (const edge of graph.edges) {
      const fromPos = position.get(edge.from);
      const toPos = position.get(edge.to);
      assert.ok(
        fromPos !== undefined && toPos !== undefined && fromPos < toPos,
        `Expected ${edge.from} (${fromPos}) before ${edge.to} (${toPos})`
      );
    }
  });

  it('automatically detects and breaks circular dependencies in dirty Jira data without crashing', () => {
    const baseGraph = getChronosSyntheticGraph('CHRON');
    const cyclicEdges = [
      ...baseGraph.edges,
      {
        from: 'CHRON-118',
        to: 'CHRON-104',
        dependencyType: 'Blocks',
        propagationWeight: 1.0,
      },
      {
        from: 'CHRON-105',
        to: 'CHRON-105',
        dependencyType: 'Blocks',
        propagationWeight: 1.0,
      },
    ];

    const { acyclicEdges, cycleWarnings } = detectAndBreakCycles(
      baseGraph.nodes,
      cyclicEdges
    );

    assert.ok(cycleWarnings.length >= 2, 'Should record warnings for both self-loop and cycle');
    const sorted = topologicalSort(baseGraph.nodes, acyclicEdges);
    assert.equal(sorted.length, 18);
  });

  it('completes 500-iteration Monte Carlo simulation in well under 150ms', () => {
    const graph = getChronosSyntheticGraph('CHRON');
    const sim = runMonteCarloSimulation(graph, { iterations: 500 });

    assert.equal(sim.iterations, 500);
    assert.ok(
      sim.executionTimeMs < 150,
      `Expected <150ms execution time, got ${sim.executionTimeMs}ms`
    );
    assert.ok(sim.p50Days <= sim.p85Days && sim.p85Days <= sim.p95Days);
    assert.ok(sim.criticalPathNodes.length > 0);
    assert.ok(sim.topBottlenecks.length > 0);
    assert.ok(sim.topBottlenecks[0].downstreamRippleWeight > 0);
    assert.equal(sim.goalImpacts.length, 2);
    assert.equal(sim.timeMachineEpochs.length, 6);
  });

  it('computes accurate counterfactual do-calculus delay (+10d), acceleration (-4d), resource swarming, and edge decoupling', () => {
    const graph = getChronosSyntheticGraph('CHRON');

    // 1. Delay intervention (+10d)
    const delayed = runIntervention(graph, 'CORE-104', 10, 500);
    assert.equal(delayed.targetNodeKey, 'CHRON-104');
    assert.equal(delayed.deltaDays, 10);
    assert.ok(delayed.p85ShiftDays >= 8);
    assert.ok(delayed.blastRadiusNodes.includes('CHRON-109'));
    assert.ok(delayed.blastRadiusNodes.includes('CHRON-118'));

    // 2. Acceleration intervention (-4d) + Add Developer + Decouple Blocking Edges
    const accelerated = runIntervention(graph, 'CHRON-104', -4, {
      iterations: 500,
      addDeveloper: true,
      decoupleBlockingEdges: true,
    });
    assert.ok(
      accelerated.p85Days < delayed.baseline.p85Days,
      `Expected accelerated P85 (${accelerated.p85Days}d) < baseline P85 (${delayed.baseline.p85Days}d)`
    );
    assert.ok(accelerated.p85ShiftDays < 0);
  });

  it('maps raw Jira REST issues and issuelinks into a valid CausalGraph and auto-falls back when < 5 issues', async () => {
    const graph = buildDAGFromJiraIssues('DEMO', [
      {
        id: '1001',
        key: 'DEMO-1',
        fields: {
          summary: 'Core Auth Service',
          status: { name: 'In Progress' },
          timetracking: { remainingEstimateSeconds: 4 * 8 * 3600 },
          issuelinks: [
            {
              type: { name: 'Blocks', outward: 'blocks' },
              outwardIssue: { key: 'DEMO-2' },
            },
          ],
        },
      },
      {
        id: '1002',
        key: 'DEMO-2',
        fields: {
          summary: 'Checkout API Gateway',
          status: { name: 'To Do' },
          customfield_10016: 8,
        },
      },
    ]);

    assert.equal(graph.nodes.length, 2);
    assert.equal(graph.isSyntheticDemo, false);
    assert.equal(graph.edges.length, 1);

    const fallbackGraph = await fetchProjectCausalGraph({ projectKey: 'CHRON' });
    assert.equal(fallbackGraph.isSyntheticDemo, true);
    assert.equal(fallbackGraph.nodes.length, 18);

    const seedReport = await seedJiraProject('CHRON');
    assert.equal(seedReport.graph.nodes.length, 18);
  });

  it('executes Rovo Agent Actions (simulateDelayImpact, analyzeCriticalPath, seedDemoScenario)', async () => {
    const simAction = await simulateDelayImpact({
      issueKey: 'CORE-104',
      delayDays: 10,
      projectKey: 'CHRON',
    });
    assert.equal(simAction.targetNodeKey, 'CHRON-104');
    assert.equal(simAction.delayDays, 10);
    assert.ok(simAction.blastRadiusNodes.length >= 8);
    assert.ok(simAction.mitigationRecommendations.length >= 3);
    assert.ok(simAction.summaryMarkdown.includes('CHRON-104'));

    const cpAction = await analyzeCriticalPath({ projectKey: 'CHRON' });
    assert.equal(cpAction.projectKey, 'CHRON');
    assert.equal(cpAction.top3Bottlenecks.length, 3);

    const seedAction = await seedDemoScenario({ projectKey: 'CHRON' });
    assert.equal(seedAction.ready, true);
    assert.equal(seedAction.nodesCount, 18);
  });

  it('serves MCP JSON-RPC 2.0 tools/list and tools/call (pwm_simulate_intervention & pwm_get_critical_path)', async () => {
    const listRes = await mcpWebtriggerHandler({
      method: 'POST',
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });
    assert.equal(listRes.statusCode, 200);
    const listBody = JSON.parse(listRes.body);
    const toolNames = listBody.result.tools.map((t: { name: string }) => t.name);
    assert.ok(toolNames.includes('pwm_simulate_intervention'));
    assert.ok(toolNames.includes('pwm_get_critical_path'));

    const callRes = await mcpWebtriggerHandler({
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'pwm_simulate_intervention',
          arguments: { issueKey: 'CORE-104', delayDays: 6 },
        },
      }),
    });
    assert.equal(callRes.statusCode, 200);
    const callBody = JSON.parse(callRes.body);
    assert.equal(callBody.result.structuredContent.targetNodeKey, 'CHRON-104');
  });

  it('compiles a valid Custom UI browser bundle at static/ui/build/app.js', () => {
    const appJsPath = path.resolve(__dirname, '../../../static/ui/build/app.js');
    assert.ok(fs.existsSync(appJsPath), 'Expected static/ui/build/app.js to exist');
    const code = fs.readFileSync(appJsPath, 'utf8');
    const script = new vm.Script(code, { filename: 'app.js' });
    assert.ok(script);
  });
});
