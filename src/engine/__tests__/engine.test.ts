import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {
  buildDAGFromJiraIssues,
  computeBrooksLawMetrics,
  computeDeterministicCriticalPath,
  computeNodeCompletionStepPct,
  computePertParameters,
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

    const zeroDelaySwarm = await simulateDelayImpact({
      issueKey: 'CORE-104',
      delayDays: 0,
      addDeveloper: true,
      projectKey: 'CHRON',
    });
    assert.equal(zeroDelaySwarm.delayDays, 0);
    assert.ok(zeroDelaySwarm.p85ShiftDays < 0);

    const seedAction = await seedDemoScenario({ projectKey: 'CHRON' });
    assert.equal(seedAction.ready, true);
    assert.equal(seedAction.nodesCount, 18);
  });

  it('maintains causal start ordering on decoupled edges and synthesizes internal fallback links when only external links exist', () => {
    const graph = getChronosSyntheticGraph('CHRON');
    const decoupled = runIntervention(graph, 'CHRON-104', 0, {
      iterations: 200,
      decoupleBlockingEdges: true,
    });
    const predStat = decoupled.nodeStats['CHRON-104'];
    const succStat = decoupled.nodeStats['CHRON-105'];
    assert.ok(predStat && succStat);
    assert.ok(
      succStat.p50StartDay >= predStat.p50StartDay,
      `Expected decoupled successor CHRON-105 start (${succStat.p50StartDay}d) >= predecessor CHRON-104 start (${predStat.p50StartDay}d)`
    );

    const extOnlyGraph = buildDAGFromJiraIssues('BLP', [
      {
        id: '2001',
        key: 'BLP-1',
        fields: {
          summary: 'First Sprint Task',
          status: { name: 'In Progress' },
          issuelinks: [
            {
              type: { name: 'Blocks', outward: 'blocks' },
              outwardIssue: { key: 'OTHER-99' },
            },
          ],
        },
      },
      {
        id: '2002',
        key: 'BLP-2',
        fields: {
          summary: 'Second Sprint Task',
          status: { name: 'To Do' },
        },
      },
    ]);
    assert.equal(extOnlyGraph.edges.length, 1);
    assert.equal(extOnlyGraph.edges[0].from, 'BLP-1');
    assert.equal(extOnlyGraph.edges[0].to, 'BLP-2');
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

  it('evaluates 4 precedence types (FS, SS, FF, SF), positive/negative lagDays, and forced-deadline negative float', () => {
    const graph = buildDAGFromJiraIssues('PREC', [
      {
        id: '3001',
        key: 'PREC-1',
        fields: {
          summary: 'API Schema Design',
          status: { name: 'In Progress' },
          customfield_10016: 8,
          issuelinks: [
            {
              type: { name: 'Blocks', outward: 'blocks' },
              outwardIssue: { key: 'PREC-2' },
            },
          ],
        },
      },
      {
        id: '3002',
        key: 'PREC-2',
        fields: {
          summary: 'Frontend Integration',
          status: { name: 'To Do' },
          customfield_10016: 6,
          issuelinks: [
            {
              type: { name: 'Blocks', outward: 'blocks' },
              outwardIssue: { key: 'PREC-3' },
            },
          ],
        },
      },
      {
        id: '3003',
        key: 'PREC-3',
        fields: {
          summary: 'E2E Verification Gate [Gate]',
          status: { name: 'To Do' },
          customfield_10016: 4,
          labels: ['gate'],
        },
      },
    ]);

    // Configure SS with +2d lag on first edge and FF with -2d fast-tracking overlap on second edge
    graph.edges[0].precedenceType = 'SS';
    graph.edges[0].lagDays = 2;
    graph.edges[1].precedenceType = 'FF';
    graph.edges[1].lagDays = -2;

    // Force an aggressive target deadline (5 days) to trigger negative float (super-critical path)
    const cp = computeDeterministicCriticalPath(graph, 5);
    assert.ok(
      cp['PREC-1'].totalFloatDays < 0,
      `Expected negative float under tight deadline, got ${cp['PREC-1'].totalFloatDays}`
    );

    // Set goal targetDayOffset = 5 so Monte Carlo simulation also flags superCriticalNodes
    graph.goals[0].targetDayOffset = 5;
    const sim = runMonteCarloSimulation(graph, { iterations: 300 });
    assert.ok((sim.superCriticalNodes?.length ?? 0) >= 1, 'Expected superCriticalNodes when goal deadline is tight');
    assert.ok((sim.reserves?.baseTargetDays ?? 0) > 0);
    assert.ok((sim.reserves?.pmContingencyReserveDays ?? 0) >= 0);
    assert.ok((sim.reserves?.managementReserveDays ?? 0) >= 0);
    assert.ok(
      (sim.reserves?.bufferBurnRatio ?? 0) >= 0,
      `Expected non-negative bufferBurnRatio, got ${sim.reserves?.bufferBurnRatio}`
    );
  });

  it('computes Brooks Law communication overhead N = n(n-1)/2, onboarding drag, and parallel assignee contention', () => {
    const baseGraph = getChronosSyntheticGraph('CHRON');
    const targetNode = baseGraph.nodes.find((n) => n.key === 'CHRON-104')!;
    const brooks = computeBrooksLawMetrics(targetNode);

    assert.ok(
      brooks.communicationChannelsAfter > brooks.communicationChannelsBefore,
      'Expected communication channels N = n(n-1)/2 to grow when adding +1 developer'
    );
    assert.ok(brooks.onboardingPenaltyDays > 0, 'Expected positive onboarding mentoring drag');

    const simWithDev = runIntervention(baseGraph, 'CHRON-104', 8, {
      iterations: 300,
      addDeveloper: true,
    });
    assert.ok(simWithDev.deliveryGovernance?.brooksLawDiagnostic !== undefined);
    assert.ok((simWithDev.deliveryGovernance?.brooksLawDiagnostic?.communicationChannelsAfter ?? 0) > 0);
  });

  it('computes 3-Point PERT Beta parameters, discrete Bernoulli pureRisks, and Hierarchical Engineering EVM (75% vs 100% handoff rule)', () => {
    const graph = buildDAGFromJiraIssues('EVM', [
      {
        id: '4001',
        key: 'EVM-1',
        fields: {
          summary: 'Backend Service Implementation',
          status: { name: 'Done' },
          labels: ['pert:2-5-14'],
          customfield_10016: 5,
          issuelinks: [
            {
              type: { name: 'Blocks', outward: 'blocks' },
              outwardIssue: { key: 'EVM-2' },
            },
          ],
        },
      },
      {
        id: '4002',
        key: 'EVM-2',
        fields: {
          summary: 'Downstream Consumer Blocked',
          status: { name: 'Blocked' },
          customfield_10016: 6,
        },
      },
    ]);

    const node1 = graph.nodes[0];
    assert.equal(node1.optimisticDays, 2);
    assert.equal(node1.mostLikelyDays, 5);
    assert.equal(node1.pessimisticDays, 14);

    // PERT Mean = (2 + 4*5 + 14) / 6 = 6.0, PERT Sigma = (14 - 2) / 6 = 2.0
    const pert = computePertParameters(node1);
    assert.equal(pert.meanDays, 6);
    assert.equal(pert.sigmaDays, 2);

    // Mark EVM-1 handoff as unaccepted by downstream -> capped at 75% step completion
    node1.handoffAcceptedByDownstream = false;
    const nodeMap = new Map(graph.nodes.map((n) => [n.key, n]));
    const outgoingEdges = graph.edges.filter((e) => e.from === node1.key);
    const stepPctBlocked = computeNodeCompletionStepPct(node1, outgoingEdges, nodeMap);
    assert.equal(stepPctBlocked, 75);

    // Attach a discrete Bernoulli pure risk event to EVM-2
    graph.nodes[1].pureRisks = [
      {
        id: 'RISK-1',
        title: 'Third-party API rate limit change',
        probability: 0.5,
        delayImpactDays: 5,
      },
    ];

    const sim = runMonteCarloSimulation(graph, { iterations: 300 });
    assert.ok((sim.earnedValue?.bacDays ?? 0) > 0);
    assert.ok((sim.earnedValue?.cpi ?? 0) > 0);
    assert.ok((sim.earnedValue?.spi ?? 0) > 0);
    assert.ok((sim.earnedValue?.eacTrendDays ?? 0) > 0);
    assert.ok((sim.deliveryGovernance?.blockedHandoffIdleDays ?? 0) >= 0);
    assert.ok((sim.deliveryGovernance?.hypercareReserveDays ?? 0) >= 0.5);
    assert.ok((sim.deliveryGovernance?.lessonsLearntCalibration.empiricalVelocityRatio ?? 0) > 0);
  });
});
