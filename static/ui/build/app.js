(() => {
"use strict";

const MCP_TOOLS_MANIFEST = [
  { name: 'pwm_simulate_intervention' },
  { name: 'pwm_get_critical_path' },
  { name: 'pwm_simulate_delay_impact' },
  { name: 'pwm_analyze_critical_path' },
  { name: 'pwm_seed_demo_scenario' },
  { name: 'pwm_get_causal_graph' }
];

// === Module: engine/types ===
/**
 * Project World Model (PWM) — Core Causal AI & Monte Carlo Simulation Types
 * Zero-dependency TypeScript types for Atlassian Forge (nodejs20.x).
 */


// === Module: engine/dag ===
/**
 * Project World Model (PWM) — Directed Acyclic Graph (DAG) Engine
 *
 * Pure, zero-dependency TypeScript implementation for Atlassian Forge (nodejs20.x):
 * 1. DAG construction from Jira issues & issue links (`Blocks`, `Depends on`, `Architectural Decision`)
 * 2. Three-color DFS cycle detection with automatic back-edge removal & warning logs
 * 3. Deterministic Kahn's algorithm topological sorting
 * 4. Downstream blast radius & effective causal propagation weight calculation
 * 5. Forward/backward pass deterministic critical path & float (slack) analysis
 */
/**
 * Resolves a node identifier (either `node.key`, `node.id`, or matching numeric suffix like `CORE-104` -> `CHRON-104`)
 * to its canonical `node.key`.
 */
function resolveNodeKey(nodes, identifier) {
    const normalized = identifier.trim().toUpperCase();
    const exact = nodes.find((n) => n.key.toUpperCase() === normalized || n.id.toUpperCase() === normalized);
    if (exact)
        return exact.key;
    // Fallback: match by numeric suffix (e.g., CORE-104 matches CHRON-104)
    const suffixMatch = normalized.match(/-(\d+)$/);
    if (suffixMatch) {
        const suffix = `-${suffixMatch[1]}`;
        const bySuffix = nodes.find((n) => n.key.toUpperCase().endsWith(suffix));
        if (bySuffix)
            return bySuffix.key;
    }
    return undefined;
}
/**
 * Detects directed cycles using three-color Depth-First Search (DFS) and
 * automatically breaks cycles by removing cycle-closing back-edges.
 * Logs descriptive warnings so dirty Jira link data never crashes the engine.
 */
function detectAndBreakCycles(nodes, rawEdges) {
    const validKeys = new Set(nodes.map((n) => n.key));
    const cycleWarnings = [];
    // 1. Normalize & deduplicate edges, dropping self-loops and dangling references
    const edgeMap = new Map();
    for (const edge of rawEdges) {
        const fromKey = resolveNodeKey(nodes, edge.from) ?? edge.from;
        const toKey = resolveNodeKey(nodes, edge.to) ?? edge.to;
        if (!validKeys.has(fromKey) || !validKeys.has(toKey)) {
            continue;
        }
        if (fromKey === toKey) {
            const msg = `[PWM DAG Warning] Self-loop detected and broken on ${fromKey} (${edge.dependencyType}).`;
            console.warn(msg);
            cycleWarnings.push(msg);
            continue;
        }
        const pairKey = `${fromKey}->${toKey}`;
        const clampedWeight = Math.max(0.05, Math.min(1.0, edge.propagationWeight ?? 1.0));
        const existing = edgeMap.get(pairKey);
        if (!existing || clampedWeight > existing.propagationWeight) {
            edgeMap.set(pairKey, {
                from: fromKey,
                to: toKey,
                dependencyType: edge.dependencyType || 'Blocks',
                propagationWeight: clampedWeight,
            });
        }
    }
    // Build adjacency list in deterministic order
    const adjacency = new Map();
    for (const node of nodes) {
        adjacency.set(node.key, []);
    }
    for (const edge of edgeMap.values()) {
        adjacency.get(edge.from)?.push(edge);
    }
    // Three-color DFS state: 0 = UNVISITED, 1 = VISITING (in active recursion stack), 2 = VISITED
    const color = new Map();
    const parentInStack = new Map();
    const removedPairKeys = new Set();
    for (const node of nodes) {
        color.set(node.key, 0);
    }
    const reconstructCyclePath = (fromKey, toKey) => {
        const chain = [toKey, fromKey];
        let cursor = fromKey;
        let safety = 0;
        while (cursor && cursor !== toKey && safety < nodes.length + 2) {
            cursor = parentInStack.get(cursor);
            if (cursor) {
                chain.push(cursor);
            }
            safety++;
        }
        return chain.reverse().join(' -> ');
    };
    const dfs = (u) => {
        color.set(u, 1);
        const outgoing = adjacency.get(u) ?? [];
        for (const edge of outgoing) {
            const v = edge.to;
            const pairKey = `${u}->${v}`;
            if (removedPairKeys.has(pairKey)) {
                continue;
            }
            const vColor = color.get(v) ?? 0;
            if (vColor === 1) {
                // Back-edge detected -> break cycle
                removedPairKeys.add(pairKey);
                const cyclePath = reconstructCyclePath(u, v);
                const warning = `[PWM DAG Warning] Circular dependency detected and broken: removed back-edge ${u} -> ${v} (${edge.dependencyType}) in cycle [${cyclePath}].`;
                console.warn(warning);
                cycleWarnings.push(warning);
            }
            else if (vColor === 0) {
                parentInStack.set(v, u);
                dfs(v);
            }
        }
        color.set(u, 2);
    };
    for (const node of nodes) {
        if ((color.get(node.key) ?? 0) === 0) {
            dfs(node.key);
        }
    }
    const acyclicEdges = [];
    for (const [pairKey, edge] of edgeMap.entries()) {
        if (!removedPairKeys.has(pairKey)) {
            acyclicEdges.push(edge);
        }
    }
    return { acyclicEdges, cycleWarnings };
}
/**
 * Performs deterministic Kahn's topological sorting over a cycle-safe DAG.
 * Returns node keys ordered from upstream roots to downstream leaves.
 */
function topologicalSort(nodes, edges) {
    const inDegree = new Map();
    const adj = new Map();
    const nodeIndex = new Map();
    nodes.forEach((node, idx) => {
        inDegree.set(node.key, 0);
        adj.set(node.key, []);
        nodeIndex.set(node.key, idx);
    });
    for (const edge of edges) {
        if (inDegree.has(edge.from) && inDegree.has(edge.to)) {
            adj.get(edge.from).push(edge.to);
            inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
        }
    }
    // Ready queue sorted deterministically by original node index
    const queue = [];
    for (const node of nodes) {
        if ((inDegree.get(node.key) ?? 0) === 0) {
            queue.push(node.key);
        }
    }
    queue.sort((a, b) => (nodeIndex.get(a) ?? 0) - (nodeIndex.get(b) ?? 0));
    const sorted = [];
    while (queue.length > 0) {
        const current = queue.shift();
        sorted.push(current);
        const neighbors = adj.get(current) ?? [];
        for (const next of neighbors) {
            const updated = (inDegree.get(next) ?? 1) - 1;
            inDegree.set(next, updated);
            if (updated === 0) {
                queue.push(next);
                queue.sort((a, b) => (nodeIndex.get(a) ?? 0) - (nodeIndex.get(b) ?? 0));
            }
        }
    }
    // Fallback safeguard if uncleaned edges were passed directly
    if (sorted.length < nodes.length) {
        const placed = new Set(sorted);
        for (const node of nodes) {
            if (!placed.has(node.key)) {
                sorted.push(node.key);
            }
        }
    }
    return sorted;
}
/**
 * Constructs a validated, cycle-free `CausalGraph` from nodes, edges, goals, and teams.
 */
function buildCausalDAG(params) {
    const referenceDate = params.referenceDate ?? new Date().toISOString().slice(0, 10);
    const { acyclicEdges, cycleWarnings } = detectAndBreakCycles(params.nodes, params.edges);
    const topologicalOrder = topologicalSort(params.nodes, acyclicEdges);
    return {
        projectKey: params.projectKey,
        projectName: params.projectName,
        referenceDate,
        source: params.source,
        isSyntheticDemo: params.isSyntheticDemo ?? params.source === 'synthetic-seed',
        nodes: params.nodes,
        edges: acyclicEdges,
        goals: params.goals,
        teams: params.teams,
        cycleWarnings,
        topologicalOrder,
    };
}
/**
 * Computes the downstream blast radius from a given `targetNodeId` (`key` or `id`),
 * returning a map of `downstreamNodeKey -> effectivePropagationWeight` (0..1)
 * in topological order.
 */
function getDownstreamBlastRadius(graph, targetNodeId) {
    const targetKey = resolveNodeKey(graph.nodes, targetNodeId);
    if (!targetKey) {
        return { targetKey: undefined, blastRadiusKeys: [], effectiveWeights: {} };
    }
    const outgoing = new Map();
    for (const node of graph.nodes) {
        outgoing.set(node.key, []);
    }
    for (const edge of graph.edges) {
        outgoing.get(edge.from)?.push(edge);
    }
    const effectiveWeights = {
        [targetKey]: 1.0,
    };
    // Traverse in topological order starting from targetKey
    const topo = graph.topologicalOrder.length === graph.nodes.length
        ? graph.topologicalOrder
        : topologicalSort(graph.nodes, graph.edges);
    const startIdx = topo.indexOf(targetKey);
    if (startIdx >= 0) {
        for (let i = startIdx; i < topo.length; i++) {
            const u = topo[i];
            const uWeight = effectiveWeights[u];
            if (uWeight === undefined) {
                continue;
            }
            const edgesFromU = outgoing.get(u) ?? [];
            for (const edge of edgesFromU) {
                const candidateWeight = Number((uWeight * edge.propagationWeight).toFixed(4));
                const currentBest = effectiveWeights[edge.to] ?? 0;
                if (candidateWeight > currentBest) {
                    effectiveWeights[edge.to] = candidateWeight;
                }
            }
        }
    }
    const blastRadiusKeys = topo.filter((k) => k !== targetKey && (effectiveWeights[k] ?? 0) > 0);
    return {
        targetKey,
        blastRadiusKeys,
        effectiveWeights,
    };
}
/**
 * Computes deterministic Critical Path Method (CPM) forward/backward pass metrics:
 * Earliest Start (ES), Earliest Finish (EF), Latest Start (LS), Latest Finish (LF),
 * Total Float (`slackDays`), transitive downstream dependency count, and cumulative
 * downstream ripple weight.
 */
function computeDeterministicCriticalPath(graph) {
    const topo = graph.topologicalOrder.length === graph.nodes.length
        ? graph.topologicalOrder
        : topologicalSort(graph.nodes, graph.edges);
    const nodeMap = new Map(graph.nodes.map((n) => [n.key, n]));
    const incoming = new Map();
    const outgoing = new Map();
    for (const node of graph.nodes) {
        incoming.set(node.key, []);
        outgoing.set(node.key, []);
    }
    for (const edge of graph.edges) {
        incoming.get(edge.to)?.push(edge);
        outgoing.get(edge.from)?.push(edge);
    }
    const effectiveDuration = (node) => {
        if (node.status.toLowerCase() === 'done') {
            return 0;
        }
        return Math.max(0.5, node.baseEstimateDays);
    };
    // Forward pass
    const ES = new Map();
    const EF = new Map();
    for (const key of topo) {
        const node = nodeMap.get(key);
        const preds = incoming.get(key) ?? [];
        let maxPredFinish = 0;
        for (const edge of preds) {
            const predEF = EF.get(edge.from) ?? 0;
            const weightedFinish = predEF * edge.propagationWeight;
            if (weightedFinish > maxPredFinish) {
                maxPredFinish = weightedFinish;
            }
        }
        const dur = effectiveDuration(node);
        ES.set(key, maxPredFinish);
        EF.set(key, maxPredFinish + dur);
    }
    let projectDuration = 0;
    for (const ef of EF.values()) {
        if (ef > projectDuration) {
            projectDuration = ef;
        }
    }
    // Backward pass + transitive downstream count
    const LS = new Map();
    const LF = new Map();
    const downstreamSets = new Map();
    for (let i = topo.length - 1; i >= 0; i--) {
        const key = topo[i];
        const node = nodeMap.get(key);
        const dur = effectiveDuration(node);
        const succs = outgoing.get(key) ?? [];
        const ds = new Set();
        if (succs.length === 0) {
            LF.set(key, projectDuration);
            LS.set(key, Math.max(0, projectDuration - dur));
        }
        else {
            let minSuccStart = projectDuration;
            for (const edge of succs) {
                ds.add(edge.to);
                const childDs = downstreamSets.get(edge.to);
                if (childDs) {
                    for (const item of childDs) {
                        ds.add(item);
                    }
                }
                const succLS = LS.get(edge.to) ?? projectDuration;
                const effectiveConstraint = edge.propagationWeight > 0 ? succLS / edge.propagationWeight : succLS;
                const boundedConstraint = Math.min(projectDuration, effectiveConstraint);
                if (boundedConstraint < minSuccStart) {
                    minSuccStart = boundedConstraint;
                }
            }
            LF.set(key, minSuccStart);
            LS.set(key, Math.max(0, minSuccStart - dur));
        }
        downstreamSets.set(key, ds);
    }
    const result = {};
    for (const key of topo) {
        const es = Number((ES.get(key) ?? 0).toFixed(2));
        const ef = Number((EF.get(key) ?? 0).toFixed(2));
        const ls = Number((LS.get(key) ?? 0).toFixed(2));
        const lf = Number((LF.get(key) ?? 0).toFixed(2));
        const slackDays = Number(Math.max(0, ls - es).toFixed(2));
        const node = nodeMap.get(key);
        const isDone = node.status.toLowerCase() === 'done';
        const blast = getDownstreamBlastRadius(graph, key);
        let cumulativeRippleWeight = 0;
        for (const dsKey of blast.blastRadiusKeys) {
            cumulativeRippleWeight += blast.effectiveWeights[dsKey] ?? 0;
        }
        result[key] = {
            key,
            earliestStart: es,
            earliestFinish: ef,
            latestStart: ls,
            latestFinish: lf,
            slackDays,
            downstreamCount: downstreamSets.get(key)?.size ?? 0,
            downstreamRippleWeight: Number(cumulativeRippleWeight.toFixed(2)),
            isOnCriticalPath: !isDone && slackDays <= 0.75,
        };
    }
    return result;
}
/**
 * Converts live Jira REST API issues (`RawJiraIssue[]`) and their `issuelinks`
 * into a cycle-safe `CausalGraph` ready for Monte Carlo simulation.
 */
function buildDAGFromJiraIssues(projectKey, rawIssues, goals = [], teams = [], referenceDate) {
    const defaultTeams = teams.length > 0
        ? teams
        : [
            {
                id: 'team-core-engine',
                name: 'Core Engine',
                lead: 'Elena Vance',
                color: '#6366f1',
                cognitiveLoad: 78,
            },
            {
                id: 'team-cloud-infra',
                name: 'Cloud Infra',
                lead: 'Marcus Chen',
                color: '#06b6d4',
                cognitiveLoad: 74,
            },
            {
                id: 'team-client-ui',
                name: 'Client UI',
                lead: 'Aria Patel',
                color: '#10b981',
                cognitiveLoad: 66,
            },
        ];
    const defaultGoals = goals.length > 0
        ? goals
        : [
            {
                id: 'GOAL-ALPHA',
                key: 'TWG-GOAL-101',
                name: 'Zero-Downtime Migration',
                targetDate: addCalendarDays(referenceDate ?? new Date().toISOString().slice(0, 10), 24),
                targetDayOffset: 24,
                ownerTeam: 'Core Engine',
                status: 'On Track',
            },
            {
                id: 'GOAL-OMEGA',
                key: 'TWG-GOAL-202',
                name: 'Q4 Global Launch',
                targetDate: addCalendarDays(referenceDate ?? new Date().toISOString().slice(0, 10), 43),
                targetDayOffset: 43,
                ownerTeam: 'Client UI',
                status: 'On Track',
            },
        ];
    const nodes = [];
    const rawEdges = [];
    rawIssues.forEach((issue, index) => {
        const statusName = issue.fields.status?.name ?? 'To Do';
        const storyPoints = issue.fields.customfield_10016 ?? null;
        const estimateSeconds = issue.fields.timetracking?.remainingEstimateSeconds ??
            issue.fields.timetracking?.originalEstimateSeconds ??
            issue.fields.timeestimate ??
            issue.fields.timeoriginalestimate ??
            null;
        let baseEstimateDays = 5;
        if (typeof estimateSeconds === 'number' && estimateSeconds > 0) {
            baseEstimateDays = Math.max(1, Math.round(estimateSeconds / (8 * 3600)));
        }
        else if (typeof storyPoints === 'number' && storyPoints > 0) {
            baseEstimateDays = Math.max(1, Math.round(storyPoints * 1.25));
        }
        else {
            const issueType = (issue.fields.issuetype?.name ?? 'Task').toLowerCase();
            baseEstimateDays = issueType === 'epic' ? 8 : issueType === 'bug' ? 3 : 5;
        }
        const statusLower = statusName.toLowerCase();
        let uncertaintySigma = 1.5;
        if (statusLower === 'done' || statusLower === 'closed' || statusLower === 'resolved') {
            uncertaintySigma = 0.2;
        }
        else if (statusLower.includes('block')) {
            uncertaintySigma = Math.max(2.2, Number((baseEstimateDays * 0.45).toFixed(2)));
        }
        else if (statusLower.includes('progress')) {
            uncertaintySigma = Math.max(1.1, Number((baseEstimateDays * 0.28).toFixed(2)));
        }
        else {
            uncertaintySigma = Math.max(1.4, Number((baseEstimateDays * 0.35).toFixed(2)));
        }
        const labels = issue.fields.labels ?? [];
        const teamLabel = labels.find((l) => l.toLowerCase().startsWith('team:'));
        const goalLabel = labels.find((l) => l.toLowerCase().startsWith('goal:'));
        const assignedTeam = teamLabel
            ? teamLabel.slice(5)
            : defaultTeams[index % defaultTeams.length].name;
        const assignedGoalId = goalLabel
            ? goalLabel.slice(5).toUpperCase()
            : defaultGoals[index < Math.ceil(rawIssues.length * 0.55) ? 0 : 1].id;
        nodes.push({
            id: issue.id || issue.key,
            key: issue.key,
            summary: issue.fields.summary || `Untitled Issue ${issue.key}`,
            status: normalizeStatus(statusName),
            baseEstimateDays,
            uncertaintySigma,
            assignee: issue.fields.assignee?.displayName || 'Unassigned',
            team: assignedTeam,
            goalId: assignedGoalId,
            issueType: issue.fields.issuetype?.name || 'Task',
            storyPoints: storyPoints ?? baseEstimateDays,
            dueDate: issue.fields.duedate ?? undefined,
        });
        // Map Jira issuelinks into directed causal edges (blocker -> dependent)
        const links = issue.fields.issuelinks ?? [];
        for (const link of links) {
            const typeName = (link.type?.name ?? 'Blocks').toLowerCase();
            const outwardDesc = (link.type?.outward ?? '').toLowerCase();
            const inwardDesc = (link.type?.inward ?? '').toLowerCase();
            const isHardBlock = typeName.includes('block') ||
                typeName.includes('depend') ||
                outwardDesc.includes('block') ||
                inwardDesc.includes('block') ||
                inwardDesc.includes('depend');
            const weight = isHardBlock ? 1.0 : 0.65;
            const depLabel = isHardBlock ? 'Blocks' : 'Architectural Decision';
            if (link.outwardIssue?.key) {
                rawEdges.push({
                    from: issue.key,
                    to: link.outwardIssue.key,
                    dependencyType: depLabel,
                    propagationWeight: weight,
                });
            }
            if (link.inwardIssue?.key) {
                rawEdges.push({
                    from: link.inwardIssue.key,
                    to: issue.key,
                    dependencyType: 'Depends on',
                    propagationWeight: weight,
                });
            }
        }
    });
    if (rawEdges.length === 0 && nodes.length > 1) {
        for (let i = 0; i < nodes.length - 1; i++) {
            rawEdges.push({
                from: nodes[i].key,
                to: nodes[i + 1].key,
                dependencyType: 'Blocks',
                propagationWeight: 0.85,
            });
        }
    }
    return buildCausalDAG({
        projectKey,
        projectName: `${projectKey} Live Jira + TWG Workspace`,
        referenceDate,
        source: 'jira-live',
        isSyntheticDemo: false,
        nodes,
        edges: rawEdges,
        goals: defaultGoals,
        teams: defaultTeams,
    });
}
function normalizeStatus(raw) {
    const lower = raw.toLowerCase();
    if (lower === 'done' || lower === 'closed' || lower === 'resolved') {
        return 'Done';
    }
    if (lower.includes('block')) {
        return 'Blocked';
    }
    if (lower.includes('progress') || lower.includes('review')) {
        return 'In Progress';
    }
    return 'To Do';
}
function addCalendarDays(isoDate, daysToAdd) {
    const base = new Date(`${isoDate.slice(0, 10)}T00:00:00.000Z`);
    base.setUTCDate(base.getUTCDate() + Math.round(daysToAdd));
    return base.toISOString().slice(0, 10);
}


// === Module: engine/simulator ===
/**
 * Project World Model (PWM) — Causal Monte Carlo & Counterfactual ($do$-calculus) Simulator
 *
 * Pure, zero-dependency TypeScript implementation for Atlassian Forge (nodejs20.x).
 * Executes 500-iteration paired twin-network (Common Random Numbers) Monte Carlo simulations
 * in < 10ms (well within the 150ms real-time interactive budget).
 *
 * Supports:
 * - Delay & Acceleration interventions (`deltaDays` from -5 to +60 days)
 * - Resource Swarming (`addDeveloper`: -35% base estimate, -40% uncertainty sigma)
 * - Dependency Decoupling (`decoupleBlockingEdges`: reduces outgoing blocking weights to 0.25)
 */
const DEFAULT_ITERATIONS = 500;
const DEFAULT_SEED = 0xc0de2026;
/**
 * Fast, deterministic Mulberry32 PRNG for Common Random Numbers (CRN) twin-network counterfactuals.
 */
function createMulberry32(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
/**
 * Box-Muller standard normal sampler N(0, 1) using deterministic PRNG.
 */
function sampleStandardNormal(rng) {
    let u1 = rng();
    let u2 = rng();
    if (u1 < 1e-12)
        u1 = 1e-12;
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}
/**
 * Computes the q-th percentile (0..1) from an already-sorted Float64Array.
 */
function percentileSorted(sorted, q) {
    if (sorted.length === 0)
        return 0;
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (base + 1 < sorted.length) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
}
/**
 * Runs a 500-iteration Monte Carlo simulation over the Project World Model DAG.
 * Supports optional Pearl $do$-calculus intervention (`deltaDays`, `addDeveloper`, `decoupleBlockingEdges`).
 */
function runMonteCarloSimulation(graph, options = {}) {
    const startClock = performance.now();
    const iterations = Math.max(50, options.iterations ?? DEFAULT_ITERATIONS);
    const seed = options.seed ?? DEFAULT_SEED;
    const topoKeys = graph.topologicalOrder.length === graph.nodes.length
        ? graph.topologicalOrder
        : topologicalSort(graph.nodes, graph.edges);
    const n = topoKeys.length;
    const keyToIndex = new Map();
    topoKeys.forEach((k, idx) => keyToIndex.set(k, idx));
    const nodeByKey = new Map(graph.nodes.map((node) => [node.key, node]));
    const orderedNodes = topoKeys.map((k) => nodeByKey.get(k));
    // Resolve optional intervention target
    const intervenedKey = options.intervention?.targetNodeId
        ? resolveNodeKey(graph.nodes, options.intervention.targetNodeId)
        : undefined;
    const interventionDelta = intervenedKey && options.intervention ? Number(options.intervention.deltaDays || 0) : 0;
    const addDeveloper = Boolean(intervenedKey && options.intervention?.addDeveloper);
    const decoupleBlockingEdges = Boolean(intervenedKey && options.intervention?.decoupleBlockingEdges);
    // Apply edge decoupling if requested
    const effectiveEdges = decoupleBlockingEdges
        ? graph.edges.map((e) => e.from === intervenedKey
            ? { ...e, propagationWeight: Math.min(e.propagationWeight, 0.25) }
            : e)
        : graph.edges;
    const effectiveGraph = decoupleBlockingEdges
        ? { ...graph, edges: effectiveEdges }
        : graph;
    // Downstream blast radius from intervened node (if any)
    const blastInfo = intervenedKey
        ? getDownstreamBlastRadius(effectiveGraph, intervenedKey)
        : { targetKey: undefined, blastRadiusKeys: [], effectiveWeights: {} };
    // Pre-index incoming edges for each topological index for ultra-fast inner loop
    const predIndices = Array.from({ length: n }, () => []);
    const predWeights = Array.from({ length: n }, () => []);
    for (const edge of effectiveEdges) {
        const uIdx = keyToIndex.get(edge.from);
        const vIdx = keyToIndex.get(edge.to);
        if (uIdx !== undefined && vIdx !== undefined) {
            predIndices[vIdx].push(uIdx);
            predWeights[vIdx].push(edge.propagationWeight);
        }
    }
    // Deterministic CPM metrics (slack, downstream counts, ripple weights)
    const cpmMetrics = computeDeterministicCriticalPath(effectiveGraph);
    // Typed storage for Monte Carlo trials
    const nodeStartSamples = Array.from({ length: n }, () => new Float64Array(iterations));
    const nodeEndSamples = Array.from({ length: n }, () => new Float64Array(iterations));
    const nodeDurationSums = new Float64Array(n);
    const criticalHits = new Uint32Array(n);
    const projectTotals = new Float64Array(iterations);
    // Per-trial scratch arrays
    const trialStart = new Float64Array(n);
    const trialEnd = new Float64Array(n);
    const criticalPred = new Int32Array(n);
    const rng = createMulberry32(seed);
    for (let iter = 0; iter < iterations; iter++) {
        let maxProjectEnd = 0;
        let terminalNodeIdx = -1;
        for (let i = 0; i < n; i++) {
            const node = orderedNodes[i];
            const isTarget = node.key === intervenedKey;
            const isDone = node.status.toLowerCase() === 'done';
            // Sample stochastic task duration using right-skewed normal noise
            const z = sampleStandardNormal(rng);
            let sampledDuration = 0;
            if (!isDone || (isTarget && (interventionDelta !== 0 || addDeveloper))) {
                let base = isDone ? 0 : Math.max(0.5, node.baseEstimateDays);
                let sigma = isDone ? 0.25 : Math.max(0.1, node.uncertaintySigma);
                if (isTarget && addDeveloper) {
                    base = Math.max(0.5, base * 0.65);
                    sigma = Math.max(0.1, sigma * 0.6);
                }
                // Right-skewed software engineering tail distribution
                const skewNoise = z >= 0 ? z * sigma * 1.28 : z * sigma * 0.62;
                const rawDuration = Math.max(base * 0.35, base + skewNoise);
                const shiftedDuration = rawDuration + (isTarget ? interventionDelta : 0);
                sampledDuration = isDone && interventionDelta <= 0 ? 0 : Math.max(0.5, shiftedDuration);
            }
            // Compute earliest start time gated by upstream predecessors
            const pIdxList = predIndices[i];
            const pWeightList = predWeights[i];
            let earliestStart = 0;
            let chosenPred = -1;
            for (let p = 0; p < pIdxList.length; p++) {
                const uIdx = pIdxList[p];
                const w = pWeightList[p];
                const candidateStart = trialEnd[uIdx] * w;
                if (candidateStart > earliestStart) {
                    earliestStart = candidateStart;
                    chosenPred = uIdx;
                }
            }
            const finish = earliestStart + sampledDuration;
            trialStart[i] = earliestStart;
            trialEnd[i] = finish;
            criticalPred[i] = chosenPred;
            nodeStartSamples[i][iter] = earliestStart;
            nodeEndSamples[i][iter] = finish;
            nodeDurationSums[i] += sampledDuration;
            if (finish > maxProjectEnd) {
                maxProjectEnd = finish;
                terminalNodeIdx = i;
            }
        }
        projectTotals[iter] = maxProjectEnd;
        // Backtrack longest path in this Monte Carlo world to record criticality
        let cursor = terminalNodeIdx;
        let safety = 0;
        while (cursor >= 0 && safety < n + 1) {
            criticalHits[cursor]++;
            cursor = criticalPred[cursor];
            safety++;
        }
    }
    // Sort project total durations for P50, P85, P95, and CVaR_0.95 (ported from ProjectWorldModel crr_engine.py)
    const sortedProjectTotals = Float64Array.from(projectTotals).sort();
    const p50Days = Number(percentileSorted(sortedProjectTotals, 0.5).toFixed(1));
    const p85Days = Number(percentileSorted(sortedProjectTotals, 0.85).toFixed(1));
    const p95Days = Number(percentileSorted(sortedProjectTotals, 0.95).toFixed(1));
    // Conditional Value at Risk: CVaR_0.95 = E[T | T >= VaR_0.95]
    const tailStartIdx = Math.floor(iterations * 0.95);
    let tailSum = 0;
    let tailCount = 0;
    for (let t = tailStartIdx; t < iterations; t++) {
        tailSum += sortedProjectTotals[t];
        tailCount++;
    }
    const cvar95Days = Number((tailCount > 0 ? tailSum / tailCount : p95Days).toFixed(1));
    const p50Date = addCalendarDays(graph.referenceDate, Math.ceil(p50Days));
    const p85Date = addCalendarDays(graph.referenceDate, Math.ceil(p85Days));
    const p95Date = addCalendarDays(graph.referenceDate, Math.ceil(p95Days));
    const cvar95Date = addCalendarDays(graph.referenceDate, Math.ceil(cvar95Days));
    // Build per-node simulation stats
    const nodeStats = {};
    for (let i = 0; i < n; i++) {
        const node = orderedNodes[i];
        const sortedStarts = Float64Array.from(nodeStartSamples[i]).sort();
        const sortedEnds = Float64Array.from(nodeEndSamples[i]).sort();
        const nodeP50Start = Number(percentileSorted(sortedStarts, 0.5).toFixed(1));
        const nodeP50End = Number(percentileSorted(sortedEnds, 0.5).toFixed(1));
        const nodeP85End = Number(percentileSorted(sortedEnds, 0.85).toFixed(1));
        const nodeP95End = Number(percentileSorted(sortedEnds, 0.95).toFixed(1));
        const criticalityIndex = Number((criticalHits[i] / iterations).toFixed(3));
        const effWeight = blastInfo.effectiveWeights[node.key] ?? 0;
        nodeStats[node.key] = {
            nodeId: node.id,
            key: node.key,
            summary: node.summary,
            team: node.team,
            goalId: node.goalId,
            status: node.status,
            baseEstimateDays: node.baseEstimateDays,
            uncertaintySigma: node.uncertaintySigma,
            p50StartDay: nodeP50Start,
            p50EndDay: nodeP50End,
            p85EndDay: nodeP85End,
            p95EndDay: nodeP95End,
            p50Date: addCalendarDays(graph.referenceDate, Math.ceil(nodeP50End)),
            p85Date: addCalendarDays(graph.referenceDate, Math.ceil(nodeP85End)),
            p95Date: addCalendarDays(graph.referenceDate, Math.ceil(nodeP95End)),
            meanDurationDays: Number((nodeDurationSums[i] / iterations).toFixed(2)),
            slackDays: cpmMetrics[node.key]?.slackDays ?? 0,
            criticalityIndex,
            rippleDelayDays: Number((interventionDelta * effWeight).toFixed(1)),
            effectivePropagationWeight: effWeight,
        };
    }
    // Identify critical path nodes in topological order
    const criticalPathNodes = topoKeys.filter((key) => {
        const stat = nodeStats[key];
        const cpm = cpmMetrics[key];
        return (stat.status.toLowerCase() !== 'done' &&
            (stat.criticalityIndex >= 0.25 || (cpm && cpm.isOnCriticalPath)));
    });
    if (criticalPathNodes.length === 0 && topoKeys.length > 0) {
        const sortedByEnd = [...topoKeys].sort((a, b) => (nodeStats[b]?.p85EndDay ?? 0) - (nodeStats[a]?.p85EndDay ?? 0));
        criticalPathNodes.push(...sortedByEnd.slice(0, Math.min(5, sortedByEnd.length)));
    }
    // Rank top bottlenecks
    const topBottlenecks = orderedNodes
        .filter((node) => node.status.toLowerCase() !== 'done')
        .map((node) => {
        const stat = nodeStats[node.key];
        const cpm = cpmMetrics[node.key];
        const downstreamCount = cpm?.downstreamCount ?? 0;
        const downstreamRippleWeight = cpm?.downstreamRippleWeight ?? 0;
        const slackDays = cpm?.slackDays ?? 0;
        // Composite causal bottleneck score (0..100)
        const criticalityTerm = stat.criticalityIndex * 45;
        const fanoutTerm = Math.min(30, downstreamRippleWeight * 3.8);
        const uncertaintyTerm = Math.min(15, node.uncertaintySigma * 4.5);
        const zeroSlackBonus = slackDays <= 0.5 ? 10 : Math.max(0, 10 - slackDays * 1.5);
        const riskScore = Math.min(99, Math.round(criticalityTerm + fanoutTerm + uncertaintyTerm + zeroSlackBonus));
        let recommendation = 'Monitor standard sprint progress; buffer is currently sufficient.';
        if (downstreamCount >= 4 && stat.criticalityIndex >= 0.35) {
            recommendation = `High-fanout structural gate (${downstreamCount} downstream tasks, ripple weight ${downstreamRippleWeight}). Add a swarm developer or decouple interface contract early.`;
        }
        else if (node.uncertaintySigma >= 2.0) {
            recommendation = `High variance (σ=${node.uncertaintySigma}d). Spike technical unknowns in the next 48h to compress P95 tail risk.`;
        }
        else if (slackDays <= 0.5) {
            recommendation = `Zero-slack critical path driver. Protect assignee focus and prevent scope creep.`;
        }
        return {
            key: node.key,
            id: node.id,
            summary: node.summary,
            team: node.team,
            assignee: node.assignee,
            status: node.status,
            goalId: node.goalId,
            baseEstimateDays: node.baseEstimateDays,
            uncertaintySigma: node.uncertaintySigma,
            criticalityIndex: stat.criticalityIndex,
            downstreamCount,
            downstreamRippleWeight,
            slackDays,
            riskScore,
            recommendation,
        };
    })
        .sort((a, b) => b.riskScore - a.riskScore || b.downstreamRippleWeight - a.downstreamRippleWeight);
    // Compute Teamwork Graph Goal impacts
    const goalImpacts = graph.goals.map((goal) => {
        const goalNodes = orderedNodes.filter((n) => n.goalId === goal.id);
        const activeNodes = goalNodes.length > 0 ? goalNodes : orderedNodes;
        const goalIterTotals = new Float64Array(iterations);
        for (let iter = 0; iter < iterations; iter++) {
            let maxGoalEnd = 0;
            for (const gn of activeNodes) {
                const idx = keyToIndex.get(gn.key);
                const val = nodeEndSamples[idx][iter];
                if (val > maxGoalEnd) {
                    maxGoalEnd = val;
                }
            }
            goalIterTotals[iter] = maxGoalEnd;
        }
        const sortedGoalTotals = Float64Array.from(goalIterTotals).sort();
        const gP50 = Number(percentileSorted(sortedGoalTotals, 0.5).toFixed(1));
        const gP85 = Number(percentileSorted(sortedGoalTotals, 0.85).toFixed(1));
        const gP95 = Number(percentileSorted(sortedGoalTotals, 0.95).toFixed(1));
        let onTimeCount = 0;
        for (let iter = 0; iter < iterations; iter++) {
            if (goalIterTotals[iter] <= goal.targetDayOffset) {
                onTimeCount++;
            }
        }
        const probabilityOfOnTime = Number((onTimeCount / iterations).toFixed(2));
        const bufferDays = Number((goal.targetDayOffset - gP85).toFixed(1));
        let status = 'On Track';
        if (bufferDays < -2 || probabilityOfOnTime < 0.45) {
            status = 'Off Track';
        }
        else if (bufferDays < 2 || probabilityOfOnTime < 0.8) {
            status = 'At Risk';
        }
        let maxGoalEffWeight = 0;
        for (const gn of activeNodes) {
            const w = blastInfo.effectiveWeights[gn.key] ?? 0;
            if (w > maxGoalEffWeight) {
                maxGoalEffWeight = w;
            }
        }
        return {
            goalId: goal.id,
            goalKey: goal.key,
            goalName: goal.name,
            ownerTeam: goal.ownerTeam,
            targetDate: goal.targetDate,
            targetDayOffset: goal.targetDayOffset,
            p50CompletionDate: addCalendarDays(graph.referenceDate, Math.ceil(gP50)),
            p85CompletionDate: addCalendarDays(graph.referenceDate, Math.ceil(gP85)),
            p95CompletionDate: addCalendarDays(graph.referenceDate, Math.ceil(gP95)),
            p85DayOffset: gP85,
            rippleDelayDays: Number((interventionDelta * maxGoalEffWeight).toFixed(1)),
            bufferDays,
            probabilityOfOnTime,
            status,
            contributingIssueKeys: activeNodes.map((n) => n.key),
        };
    });
    // Build 12 probability cone buckets for UI histogram / cone chart
    const minDay = Math.floor(sortedProjectTotals[0] ?? 0);
    const maxDay = Math.ceil(sortedProjectTotals[sortedProjectTotals.length - 1] ?? 10);
    const span = Math.max(6, maxDay - minDay + 1);
    const bucketCount = 12;
    const bucketStep = Math.max(1, Math.ceil(span / bucketCount));
    const distributionBuckets = [];
    let cumulativeCount = 0;
    for (let b = 0; b < bucketCount; b++) {
        const bucketDay = minDay + b * bucketStep;
        const nextDay = bucketDay + bucketStep;
        let countInBucket = 0;
        for (let iter = 0; iter < iterations; iter++) {
            const val = sortedProjectTotals[iter];
            if ((b === 0 && val < nextDay) ||
                (b === bucketCount - 1 && val >= bucketDay) ||
                (val >= bucketDay && val < nextDay)) {
                countInBucket++;
            }
        }
        cumulativeCount += countInBucket;
        distributionBuckets.push({
            dayOffset: bucketDay,
            date: addCalendarDays(graph.referenceDate, bucketDay),
            probability: Number((countInBucket / iterations).toFixed(3)),
            cumulativeProbability: Number(Math.min(1, cumulativeCount / iterations).toFixed(3)),
        });
    }
    // Build Time Machine Epochs (Past Sprints -> Present -> Future Probability Cones)
    const doneCount = orderedNodes.filter((n) => n.status.toLowerCase() === 'done').length;
    const inProgressCount = orderedNodes.filter((n) => n.status.toLowerCase() === 'in progress').length;
    const blockedCount = orderedNodes.filter((n) => n.status.toLowerCase() === 'blocked').length;
    const todoCount = Math.max(0, orderedNodes.length - doneCount - inProgressCount - blockedCount);
    const timeMachineEpochs = [
        {
            epochId: 'sprint-minus-2',
            label: 'Sprint -2 (Architecture Kickoff)',
            dayOffset: -28,
            date: addCalendarDays(graph.referenceDate, -28),
            mode: 'past',
            completedCount: Math.max(1, Math.floor(doneCount * 0.35)),
            inProgressCount: 3,
            blockedCount: 0,
            todoCount: orderedNodes.length - Math.max(1, Math.floor(doneCount * 0.35)) - 3,
            projectedP85Date: addCalendarDays(graph.referenceDate, Math.ceil(p85Days - 4)),
            confidenceScore: 88,
            narrative: 'Initial DAG topology established. Foundation specs and schema contracts underway with zero cross-team blocks.',
        },
        {
            epochId: 'sprint-minus-1',
            label: 'Sprint -1 (Core Integration)',
            dayOffset: -14,
            date: addCalendarDays(graph.referenceDate, -14),
            mode: 'past',
            completedCount: Math.max(2, Math.floor(doneCount * 0.75)),
            inProgressCount: Math.max(2, inProgressCount),
            blockedCount: Math.min(1, blockedCount),
            todoCount: Math.max(0, orderedNodes.length -
                Math.max(2, Math.floor(doneCount * 0.75)) -
                Math.max(2, inProgressCount) -
                Math.min(1, blockedCount)),
            projectedP85Date: addCalendarDays(graph.referenceDate, Math.ceil(p85Days - 2)),
            confidenceScore: 81,
            narrative: 'Cross-team handoffs activated between Core Engine and Cloud Infra; variance increased on integration bridges.',
        },
        {
            epochId: 'present-now',
            label: 'Today (State t₀)',
            dayOffset: 0,
            date: graph.referenceDate,
            mode: 'present',
            completedCount: doneCount,
            inProgressCount,
            blockedCount,
            todoCount,
            projectedP85Date: p85Date,
            confidenceScore: blockedCount > 0 ? 72 : 84,
            narrative: intervenedKey
                ? `Counterfactual active: do(${intervenedKey} = ${interventionDelta >= 0 ? `+${interventionDelta}` : interventionDelta}d) propagates across ${blastInfo.blastRadiusKeys.length} downstream nodes.`
                : `Live DAG baseline across ${orderedNodes.length} tasks and ${graph.edges.length} causal links.`,
        },
        {
            epochId: 'future-p50',
            label: 'Future Cone — P50 Median',
            dayOffset: Math.ceil(p50Days),
            date: p50Date,
            mode: 'future-p50',
            completedCount: orderedNodes.length,
            inProgressCount: 0,
            blockedCount: 0,
            todoCount: 0,
            projectedP85Date: p85Date,
            confidenceScore: 50,
            narrative: `50% of Monte Carlo worlds complete all ${orderedNodes.length} nodes by ${p50Date} (+${p50Days}d).`,
        },
        {
            epochId: 'future-p85',
            label: 'Future Cone — P85 Commit',
            dayOffset: Math.ceil(p85Days),
            date: p85Date,
            mode: 'future-p85',
            completedCount: orderedNodes.length,
            inProgressCount: 0,
            blockedCount: 0,
            todoCount: 0,
            projectedP85Date: p85Date,
            confidenceScore: 85,
            narrative: `High-confidence executive commitment date (${p85Date}, +${p85Days}d) accounting for cross-team handoff variance.`,
        },
        {
            epochId: 'future-p95',
            label: 'Future Cone — P95 Envelope',
            dayOffset: Math.ceil(p95Days),
            date: p95Date,
            mode: 'future-p95',
            completedCount: orderedNodes.length,
            inProgressCount: 0,
            blockedCount: 0,
            todoCount: 0,
            projectedP85Date: p85Date,
            confidenceScore: 95,
            narrative: `95th percentile worst-case envelope (${p95Date}, +${p95Days}d) absorbing compound σ tail shocks.`,
        },
    ];
    const executionTimeMs = Number((performance.now() - startClock).toFixed(2));
    // Compute Asymmetric Quasimetric Latent Energy E(s -> s' | z_env) & Rework Hours (ported from ProjectWorldModel)
    const gammaRev = decoupleBlockingEdges ? 0.92 : 0.72;
    let quadDiffSum = 0;
    let posLockInDelta = 0;
    for (let i = 0; i < n; i++) {
        const baseEst = orderedNodes[i].baseEstimateDays;
        const p85Finish = nodeStats[orderedNodes[i].key]?.p85EndDay ?? baseEst;
        const diff = p85Finish - baseEst;
        const gDiag = 1.0 + (1.0 - gammaRev) * 0.5;
        quadDiffSum += diff * diff * gDiag;
        if (orderedNodes[i].key === intervenedKey && interventionDelta > 0) {
            posLockInDelta += interventionDelta;
        }
    }
    const quasimetricEnergy = Number((Math.sqrt(Math.max(0, quadDiffSum)) + (1.0 - gammaRev) * posLockInDelta).toFixed(2));
    const estimatedReworkHours = Number(Math.max(4, (blastInfo.blastRadiusKeys.length * 3.5 + Math.max(0, interventionDelta) * 5.2) *
        (addDeveloper ? 0.65 : 1.0) *
        (decoupleBlockingEdges ? 0.5 : 1.0)).toFixed(1));
    return {
        p50Date,
        p85Date,
        p95Date,
        p50Days,
        p85Days,
        p95Days,
        cvar95Days,
        cvar95Date,
        quasimetricEnergy,
        estimatedReworkHours,
        criticalPathNodes,
        blastRadiusNodes: blastInfo.blastRadiusKeys,
        rippleDelayDays: interventionDelta,
        iterations,
        executionTimeMs,
        referenceDate: graph.referenceDate,
        intervenedNodeKey: intervenedKey,
        interventionDeltaDays: interventionDelta,
        addDeveloper,
        decoupleBlockingEdges,
        nodeStats,
        goalImpacts,
        topBottlenecks,
        distributionBuckets,
        timeMachineEpochs,
    };
}
/**
 * Executes a paired counterfactual intervention $do(\text{targetNodeId} := \Delta\text{ days})$
 * (supporting both acceleration `-5d..0d` and delay `+1d..+60d`, plus `addDeveloper` and `decoupleBlockingEdges`)
 * using Common Random Numbers (CRN) to compute the exact causal difference.
 */
function runIntervention(graph, targetNodeId, deltaDays, iterationsOrOptions = DEFAULT_ITERATIONS) {
    const startClock = performance.now();
    const iterations = typeof iterationsOrOptions === 'number'
        ? iterationsOrOptions
        : iterationsOrOptions.iterations ?? DEFAULT_ITERATIONS;
    const addDeveloper = typeof iterationsOrOptions === 'object' ? Boolean(iterationsOrOptions.addDeveloper) : false;
    const decoupleBlockingEdges = typeof iterationsOrOptions === 'object'
        ? Boolean(iterationsOrOptions.decoupleBlockingEdges)
        : false;
    // Support both acceleration (-5d) and delay (+120d)
    const sanitizedDelta = Math.max(-5, Math.min(120, Number(deltaDays) || 0));
    const resolvedKey = resolveNodeKey(graph.nodes, targetNodeId) ??
        graph.topologicalOrder[0] ??
        graph.nodes[0]?.key ??
        targetNodeId;
    const targetNode = graph.nodes.find((n) => n.key === resolvedKey);
    // 1. Run baseline world W_0 with seed DEFAULT_SEED
    const baselineSim = runMonteCarloSimulation(graph, {
        iterations,
        seed: DEFAULT_SEED,
    });
    // 2. Run counterfactual world W_{do(X)} with identical CRN seed DEFAULT_SEED
    const intervenedSim = runMonteCarloSimulation(graph, {
        iterations,
        seed: DEFAULT_SEED,
        intervention: {
            targetNodeId: resolvedKey,
            deltaDays: sanitizedDelta,
            addDeveloper,
            decoupleBlockingEdges,
        },
    });
    const blastInfo = getDownstreamBlastRadius(graph, resolvedKey);
    // Calculate exact signed per-node counterfactual shifts
    const nodeDeltas = [];
    let maxMagnitudeDownstreamShift = 0;
    for (const key of graph.topologicalOrder) {
        const baseStat = baselineSim.nodeStats[key];
        const intStat = intervenedSim.nodeStats[key];
        if (!baseStat || !intStat)
            continue;
        const shiftDays = Number((intStat.p85EndDay - baseStat.p85EndDay).toFixed(1));
        const effectiveWeight = blastInfo.effectiveWeights[key] ?? 0;
        if (key !== resolvedKey &&
            Math.abs(shiftDays) > Math.abs(maxMagnitudeDownstreamShift)) {
            maxMagnitudeDownstreamShift = shiftDays;
        }
        intStat.rippleDelayDays = shiftDays;
        if (key === resolvedKey || effectiveWeight > 0 || Math.abs(shiftDays) > 0) {
            nodeDeltas.push({
                key,
                summary: intStat.summary,
                team: intStat.team,
                goalId: intStat.goalId,
                baselineP85Date: baseStat.p85Date,
                intervenedP85Date: intStat.p85Date,
                shiftDays,
                effectiveWeight,
            });
        }
    }
    const p50ShiftDays = Number((intervenedSim.p50Days - baselineSim.p50Days).toFixed(1));
    const p85ShiftDays = Number((intervenedSim.p85Days - baselineSim.p85Days).toFixed(1));
    const p95ShiftDays = Number((intervenedSim.p95Days - baselineSim.p95Days).toFixed(1));
    // Enrich GoalImpacts with exact signed baseline comparison
    const enrichedGoalImpacts = intervenedSim.goalImpacts.map((intGoal, idx) => {
        const baseGoal = baselineSim.goalImpacts[idx];
        const goalShift = baseGoal
            ? Number((intGoal.p85DayOffset - baseGoal.p85DayOffset).toFixed(1))
            : intGoal.rippleDelayDays;
        return {
            ...intGoal,
            baselineP85Date: baseGoal?.p85CompletionDate ?? intGoal.p85CompletionDate,
            rippleDelayDays: goalShift,
        };
    });
    const rippleDelayDays = Math.abs(p85ShiftDays) > 0
        ? p85ShiftDays
        : Math.abs(maxMagnitudeDownstreamShift) > 0
            ? maxMagnitudeDownstreamShift
            : sanitizedDelta;
    const totalExecMs = Number((performance.now() - startClock).toFixed(2));
    return {
        ...intervenedSim,
        rippleDelayDays,
        goalImpacts: enrichedGoalImpacts,
        executionTimeMs: totalExecMs,
        targetNodeKey: resolvedKey,
        targetNodeSummary: targetNode?.summary ?? resolvedKey,
        deltaDays: sanitizedDelta,
        baseline: {
            p50Date: baselineSim.p50Date,
            p85Date: baselineSim.p85Date,
            p95Date: baselineSim.p95Date,
            p50Days: baselineSim.p50Days,
            p85Days: baselineSim.p85Days,
            p95Days: baselineSim.p95Days,
            distributionBuckets: baselineSim.distributionBuckets,
        },
        intervened: {
            p50Date: intervenedSim.p50Date,
            p85Date: intervenedSim.p85Date,
            p95Date: intervenedSim.p95Date,
            p50Days: intervenedSim.p50Days,
            p85Days: intervenedSim.p85Days,
            p95Days: intervenedSim.p95Days,
            distributionBuckets: intervenedSim.distributionBuckets,
        },
        p50ShiftDays,
        p85ShiftDays,
        p95ShiftDays,
        nodeDeltas,
    };
}


// === Module: twg/syntheticSeeder ===
/**
 * Project World Model (PWM) — Synthetic Seeder & Judge-Ready Demo Dataset
 *
 * Implements "Project Chronos: Next-Gen Platform Launch":
 * - 18 interconnected CausalNodes across 3 Engineering Teams (*Core Engine*, *Cloud Infra*, *Client UI*)
 * - 2 high-level Atlassian Teamwork Graph (TWG) Goals (*Zero-Downtime Migration*, *Q4 Global Launch*)
 * - Rich cross-team causal edges (`Blocks`, `Depends on`, `Architectural Decision`)
 * - Provides `seedJiraProject(projectKey)` (and `seedProjectChronosScenario`) to either:
 *   (a) Populate real linked Jira issues via `api.asApp().requestJira(route`/rest/api/3/issue`)`
 *   (b) Load a zero-setup in-memory / Forge storage causal graph snapshot (`isSyntheticDemo: true`)
 */
const CHRONOS_DEFAULT_REFERENCE_DATE = '2026-10-30';
const CHRONOS_TEAMS = [
    {
        id: 'team-core-engine',
        name: 'Core Engine',
        lead: 'Elena Vance',
        color: '#6366f1',
        cognitiveLoad: 78,
    },
    {
        id: 'team-cloud-infra',
        name: 'Cloud Infra',
        lead: 'Marcus Chen',
        color: '#06b6d4',
        cognitiveLoad: 74,
    },
    {
        id: 'team-client-ui',
        name: 'Client UI',
        lead: 'Aria Patel',
        color: '#10b981',
        cognitiveLoad: 66,
    },
];
function buildChronosGoals(referenceDate = CHRONOS_DEFAULT_REFERENCE_DATE) {
    return [
        {
            id: 'GOAL-ALPHA',
            key: 'TWG-GOAL-101',
            name: 'Zero-Downtime Migration',
            targetDate: addCalendarDays(referenceDate, 24),
            targetDayOffset: 24,
            ownerTeam: 'Core Engine',
            description: 'Complete distributed state WAL sync, zero-copy graph serializer, and zero-downtime multi-region cutover under 50ms.',
            status: 'On Track',
        },
        {
            id: 'GOAL-OMEGA',
            key: 'TWG-GOAL-202',
            name: 'Q4 Global Launch',
            targetDate: addCalendarDays(referenceDate, 43),
            targetDayOffset: 43,
            ownerTeam: 'Client UI',
            description: 'Ship interactive Time Machine cockpit, Rovo Causal Agent actions, MCP server endpoint, and pass global production readiness.',
            status: 'On Track',
        },
    ];
}
/**
 * Generates the 18 interconnected nodes for "Project Chronos: Next-Gen Platform Launch"
 * across *Core Engine*, *Cloud Infra*, and *Client UI*.
 */
function buildChronosNodes(projectKey = 'CHRON', referenceDate = CHRONOS_DEFAULT_REFERENCE_DATE) {
    const prefix = projectKey.trim().toUpperCase() || 'CHRON';
    const k = (num) => `${prefix}-${num}`;
    return [
        // =========================================================================
        // TEAM 1: Core Engine (6 Nodes: 101..106)
        // =========================================================================
        {
            id: k(101),
            key: k(101),
            summary: 'Event-Sourced Graph Schema & Immutable Ledger Spec',
            status: 'Done',
            baseEstimateDays: 4,
            uncertaintySigma: 0.4,
            assignee: 'Elena Vance',
            team: 'Core Engine',
            goalId: 'GOAL-ALPHA',
            sprint: -2,
            issueType: 'Epic',
            storyPoints: 5,
            completedDaysAgo: 18,
            dueDate: addCalendarDays(referenceDate, -18),
            confluenceDecision: {
                id: 'CONF-ADR-01',
                title: 'ADR-01: Event-Sourced Causal Graph Ledger Specification',
                spaceKey: 'ARCH',
            },
        },
        {
            id: k(102),
            key: k(102),
            summary: 'Multi-Tenant Storage Sharding & Key-Value Snapshot Layer',
            status: 'Done',
            baseEstimateDays: 5,
            uncertaintySigma: 0.5,
            assignee: 'Devon Brooks',
            team: 'Core Engine',
            goalId: 'GOAL-ALPHA',
            sprint: -1,
            issueType: 'Story',
            storyPoints: 5,
            completedDaysAgo: 9,
            dueDate: addCalendarDays(referenceDate, -9),
        },
        {
            id: k(103),
            key: k(103),
            summary: 'Incremental Jira Webhook & IssueLink Ingestion Pipeline',
            status: 'In Progress',
            baseEstimateDays: 5,
            uncertaintySigma: 1.4,
            assignee: 'Devon Brooks',
            team: 'Core Engine',
            goalId: 'GOAL-ALPHA',
            sprint: 0,
            issueType: 'Story',
            storyPoints: 5,
            dueDate: addCalendarDays(referenceDate, 5),
        },
        {
            id: k(104),
            key: k(104),
            summary: 'Distributed State Snapshot & WAL Sync Protocol',
            status: 'In Progress',
            baseEstimateDays: 7,
            uncertaintySigma: 2.3,
            assignee: 'Elena Vance',
            team: 'Core Engine',
            goalId: 'GOAL-ALPHA',
            sprint: 0,
            issueType: 'Epic',
            storyPoints: 8,
            dueDate: addCalendarDays(referenceDate, 7),
            confluenceDecision: {
                id: 'CONF-ADR-04',
                title: 'ADR-04: Distributed WAL Consensus & Snapshot Handoff Protocol',
                spaceKey: 'ARCH',
            },
        },
        {
            id: k(105),
            key: k(105),
            summary: 'High-Throughput Graph Mutation & Concurrency Lock Manager',
            status: 'To Do',
            baseEstimateDays: 6,
            uncertaintySigma: 1.8,
            assignee: 'Elena Vance',
            team: 'Core Engine',
            goalId: 'GOAL-ALPHA',
            sprint: 1,
            issueType: 'Story',
            storyPoints: 8,
            dueDate: addCalendarDays(referenceDate, 14),
        },
        {
            id: k(106),
            key: k(106),
            summary: 'Core Engine Chaos Fault-Injection & Zero-Downtime Cutover Gate',
            status: 'To Do',
            baseEstimateDays: 5,
            uncertaintySigma: 1.5,
            assignee: 'Devon Brooks',
            team: 'Core Engine',
            goalId: 'GOAL-ALPHA',
            sprint: 1,
            issueType: 'Task',
            storyPoints: 5,
            dueDate: addCalendarDays(referenceDate, 21),
        },
        // =========================================================================
        // TEAM 2: Cloud Infra (6 Nodes: 107..112)
        // =========================================================================
        {
            id: k(107),
            key: k(107),
            summary: 'Topological Sort & Three-Color DFS Cycle Breaker Kernel',
            status: 'Done',
            baseEstimateDays: 4,
            uncertaintySigma: 0.3,
            assignee: 'Marcus Chen',
            team: 'Cloud Infra',
            goalId: 'GOAL-ALPHA',
            sprint: -2,
            issueType: 'Story',
            storyPoints: 5,
            completedDaysAgo: 15,
            dueDate: addCalendarDays(referenceDate, -15),
        },
        {
            id: k(108),
            key: k(108),
            summary: 'Twin-Network Common Random Numbers (CRN) Monte Carlo Sampler',
            status: 'In Progress',
            baseEstimateDays: 6,
            uncertaintySigma: 1.6,
            assignee: 'Marcus Chen',
            team: 'Cloud Infra',
            goalId: 'GOAL-ALPHA',
            sprint: 0,
            issueType: 'Story',
            storyPoints: 8,
            dueDate: addCalendarDays(referenceDate, 6),
        },
        {
            id: k(109),
            key: k(109),
            summary: 'Zero-Copy Graph Tensor Serializer & Multi-Region Replication Bridge',
            status: 'Blocked',
            baseEstimateDays: 6,
            uncertaintySigma: 2.5,
            assignee: 'Sora Takahashi',
            team: 'Cloud Infra',
            goalId: 'GOAL-ALPHA',
            sprint: 0,
            issueType: 'Story',
            storyPoints: 8,
            dueDate: addCalendarDays(referenceDate, 13),
        },
        {
            id: k(110),
            key: k(110),
            summary: 'Atlassian Teamwork Graph (TWG) Goal-to-Issue Alignment Resolver',
            status: 'To Do',
            baseEstimateDays: 5,
            uncertaintySigma: 1.5,
            assignee: 'Sora Takahashi',
            team: 'Cloud Infra',
            goalId: 'GOAL-OMEGA',
            sprint: 1,
            issueType: 'Story',
            storyPoints: 5,
            dueDate: addCalendarDays(referenceDate, 19),
        },
        {
            id: k(111),
            key: k(111),
            summary: 'Rovo Counterfactual Action Handlers & Bottleneck Synthesizer',
            status: 'To Do',
            baseEstimateDays: 5,
            uncertaintySigma: 1.4,
            assignee: 'Marcus Chen',
            team: 'Cloud Infra',
            goalId: 'GOAL-OMEGA',
            sprint: 2,
            issueType: 'Story',
            storyPoints: 5,
            dueDate: addCalendarDays(referenceDate, 26),
        },
        {
            id: k(112),
            key: k(112),
            summary: 'Model Context Protocol (MCP) JSON-RPC World Model Webtrigger',
            status: 'To Do',
            baseEstimateDays: 4,
            uncertaintySigma: 1.2,
            assignee: 'Sora Takahashi',
            team: 'Cloud Infra',
            goalId: 'GOAL-OMEGA',
            sprint: 2,
            issueType: 'Task',
            storyPoints: 5,
            dueDate: addCalendarDays(referenceDate, 30),
        },
        // =========================================================================
        // TEAM 3: Client UI (6 Nodes: 113..118)
        // =========================================================================
        {
            id: k(113),
            key: k(113),
            summary: 'Dark-Mode Cockpit Design System & Probability Cone Tokens',
            status: 'Done',
            baseEstimateDays: 3,
            uncertaintySigma: 0.3,
            assignee: 'Aria Patel',
            team: 'Client UI',
            goalId: 'GOAL-OMEGA',
            sprint: -1,
            issueType: 'Story',
            storyPoints: 3,
            completedDaysAgo: 11,
            dueDate: addCalendarDays(referenceDate, -11),
        },
        {
            id: k(114),
            key: k(114),
            summary: 'Interactive Causal DAG Canvas & Blast Radius Ripple Renderer',
            status: 'In Progress',
            baseEstimateDays: 6,
            uncertaintySigma: 1.5,
            assignee: 'Aria Patel',
            team: 'Client UI',
            goalId: 'GOAL-OMEGA',
            sprint: 0,
            issueType: 'Story',
            storyPoints: 8,
            dueDate: addCalendarDays(referenceDate, 6),
        },
        {
            id: k(115),
            key: k(115),
            summary: 'Temporal Scrubber ("Time Machine") Past-to-Future Cone Slider',
            status: 'To Do',
            baseEstimateDays: 5,
            uncertaintySigma: 1.4,
            assignee: 'Liam O’Connor',
            team: 'Client UI',
            goalId: 'GOAL-OMEGA',
            sprint: 1,
            issueType: 'Story',
            storyPoints: 5,
            dueDate: addCalendarDays(referenceDate, 18),
        },
        {
            id: k(116),
            key: k(116),
            summary: 'Real-Time Delay/Accelerate Intervention Panel & Goal Telemetry HUD',
            status: 'To Do',
            baseEstimateDays: 5,
            uncertaintySigma: 1.5,
            assignee: 'Aria Patel',
            team: 'Client UI',
            goalId: 'GOAL-OMEGA',
            sprint: 2,
            issueType: 'Story',
            storyPoints: 5,
            dueDate: addCalendarDays(referenceDate, 25),
        },
        {
            id: k(117),
            key: k(117),
            summary: 'End-to-End Multi-Team Shadow Simulation & Load Verification',
            status: 'To Do',
            baseEstimateDays: 5,
            uncertaintySigma: 1.7,
            assignee: 'Liam O’Connor',
            team: 'Client UI',
            goalId: 'GOAL-OMEGA',
            sprint: 2,
            issueType: 'Task',
            storyPoints: 5,
            dueDate: addCalendarDays(referenceDate, 33),
        },
        {
            id: k(118),
            key: k(118),
            summary: 'Project Chronos Q4 Global Launch Production Cutover & Sign-Off',
            status: 'To Do',
            baseEstimateDays: 4,
            uncertaintySigma: 1.1,
            assignee: 'Aria Patel',
            team: 'Client UI',
            goalId: 'GOAL-OMEGA',
            sprint: 3,
            issueType: 'Milestone',
            storyPoints: 5,
            dueDate: addCalendarDays(referenceDate, 39),
        },
    ];
}
/**
 * Generates the causal dependency edges (`Blocks`, `Depends on`, `Architectural Decision`)
 * connecting the 18 nodes across *Core Engine*, *Cloud Infra*, and *Client UI*.
 */
function buildChronosEdges(projectKey = 'CHRON') {
    const prefix = projectKey.trim().toUpperCase() || 'CHRON';
    const k = (num) => `${prefix}-${num}`;
    return [
        // Foundation links
        { from: k(101), to: k(102), dependencyType: 'Blocks', propagationWeight: 1.0 },
        { from: k(101), to: k(107), dependencyType: 'Architectural Decision', propagationWeight: 0.9 },
        { from: k(102), to: k(103), dependencyType: 'Blocks', propagationWeight: 0.9 },
        { from: k(102), to: k(104), dependencyType: 'Blocks', propagationWeight: 1.0 },
        // Critical bottleneck fan-out from CHRON-104 (Distributed State Snapshot & WAL Sync Protocol)
        { from: k(104), to: k(105), dependencyType: 'Blocks', propagationWeight: 1.0 },
        { from: k(104), to: k(109), dependencyType: 'Architectural Decision', propagationWeight: 1.0 },
        { from: k(103), to: k(110), dependencyType: 'Depends on', propagationWeight: 0.85 },
        // Core Engine completion chain -> GOAL-ALPHA (Zero-Downtime Migration)
        { from: k(105), to: k(106), dependencyType: 'Blocks', propagationWeight: 1.0 },
        { from: k(109), to: k(106), dependencyType: 'Depends on', propagationWeight: 0.85 },
        // Cloud Infra chain
        { from: k(107), to: k(108), dependencyType: 'Blocks', propagationWeight: 1.0 },
        { from: k(108), to: k(109), dependencyType: 'Blocks', propagationWeight: 0.95 },
        { from: k(109), to: k(110), dependencyType: 'Blocks', propagationWeight: 1.0 },
        { from: k(109), to: k(111), dependencyType: 'Blocks', propagationWeight: 1.0 },
        { from: k(110), to: k(111), dependencyType: 'Depends on', propagationWeight: 0.9 },
        { from: k(110), to: k(112), dependencyType: 'Blocks', propagationWeight: 0.95 },
        // Client UI chain + Cross-Team Handoffs
        { from: k(113), to: k(114), dependencyType: 'Blocks', propagationWeight: 1.0 },
        { from: k(108), to: k(115), dependencyType: 'Architectural Decision', propagationWeight: 0.85 },
        { from: k(114), to: k(115), dependencyType: 'Blocks', propagationWeight: 1.0 },
        { from: k(109), to: k(116), dependencyType: 'Depends on', propagationWeight: 0.95 },
        { from: k(115), to: k(116), dependencyType: 'Blocks', propagationWeight: 1.0 },
        // Final convergence to Q4 Global Launch (CHRON-117 -> CHRON-118)
        { from: k(106), to: k(117), dependencyType: 'Architectural Decision', propagationWeight: 0.95 },
        { from: k(111), to: k(117), dependencyType: 'Blocks', propagationWeight: 1.0 },
        { from: k(112), to: k(117), dependencyType: 'Depends on', propagationWeight: 0.9 },
        { from: k(116), to: k(117), dependencyType: 'Blocks', propagationWeight: 1.0 },
        { from: k(117), to: k(118), dependencyType: 'Blocks', propagationWeight: 1.0 },
    ];
}
/**
 * Returns the complete, cycle-verified 18-node "Project Chronos: Next-Gen Platform Launch"
 * `CausalGraph` snapshot (`isSyntheticDemo: true`) ready for simulation.
 */
function getChronosSyntheticGraph(projectKey = 'CHRON', referenceDate = CHRONOS_DEFAULT_REFERENCE_DATE) {
    const cleanKey = projectKey.trim().toUpperCase() || 'CHRON';
    const nodes = buildChronosNodes(cleanKey, referenceDate);
    const edges = buildChronosEdges(cleanKey);
    const goals = buildChronosGoals(referenceDate);
    return buildCausalDAG({
        projectKey: cleanKey,
        projectName: 'Project Chronos: Next-Gen Platform Launch',
        referenceDate,
        source: 'synthetic-seed',
        isSyntheticDemo: true,
        nodes,
        edges,
        goals,
        teams: CHRONOS_TEAMS,
    });
}
/**
 * Helper `seedJiraProject(projectKey)` that uses `api.asApp().requestJira(route`/rest/api/3/issue`)`
 * to create real linked demo issues in Jira when the user clicks "Create Real Jira Issues".
 */
async function seedJiraProject(projectKey = 'CHRON') {
    return seedProjectChronosScenario({
        projectKey,
        populateJiraIssues: true,
    });
}
/**
 * Populates the Project Chronos scenario either:
 * (a) into live Jira issues + issueLinks via `api.asApp().requestJira()` when `populateJiraIssues` is true, OR
 * (b) into an in-memory / Forge app storage causal graph snapshot (`isSyntheticDemo: true`) so judges can test
 *     immediately in empty Jira cloud instances with zero setup.
 */
async function seedProjectChronosScenario(options = {}) {
    const projectKey = (options.projectKey || 'CHRON').trim().toUpperCase();
    const referenceDate = options.referenceDate || CHRONOS_DEFAULT_REFERENCE_DATE;
    const syntheticGraph = getChronosSyntheticGraph(projectKey, referenceDate);
    // Attempt to persist snapshot in Forge KVS storage if running inside Atlassian Forge
    try {
        const forgeApi = await import('@forge/api');
        if (forgeApi?.storage) {
            await forgeApi.storage.set(`pwm:graph:${projectKey}`, syntheticGraph);
            await forgeApi.storage.set('pwm:activeDemoGraph', syntheticGraph);
        }
    }
    catch {
        // Running outside Forge runtime (e.g., local test runner); in-memory graph is returned directly
    }
    if (!options.populateJiraIssues) {
        return {
            mode: 'in-memory-snapshot',
            projectKey,
            createdIssuesCount: 0,
            createdLinksCount: 0,
            graph: syntheticGraph,
            message: `Loaded "Project Chronos: Next-Gen Platform Launch" (${syntheticGraph.nodes.length} causal nodes, ${syntheticGraph.edges.length} dependency links across ${syntheticGraph.teams.length} teams and ${syntheticGraph.goals.length} Teamwork Graph Goals).`,
        };
    }
    // Option (a): Attempt to create real linked Jira issues via `api.asApp().requestJira(route`/rest/api/3/issue`)`
    let createdIssuesCount = 0;
    let createdLinksCount = 0;
    const syntheticToRealKey = new Map();
    try {
        const forgeApi = await import('@forge/api');
        const api = forgeApi.default;
        const { route } = forgeApi;
        for (const node of syntheticGraph.nodes) {
            const response = await api.asApp().requestJira(route `/rest/api/3/issue`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fields: {
                        project: { key: projectKey },
                        summary: `[PWM] ${node.summary}`,
                        issuetype: { name: 'Task' },
                        labels: [
                            `team:${node.team.replace(/\s+/g, '-')}`,
                            `goal:${node.goalId}`,
                            `estimate:${node.baseEstimateDays}d`,
                        ],
                    },
                }),
            });
            if (response.ok) {
                const data = (await response.json());
                if (data?.key) {
                    syntheticToRealKey.set(node.key, data.key);
                    createdIssuesCount++;
                }
            }
            else {
                break;
            }
        }
        if (createdIssuesCount >= 5) {
            for (const edge of syntheticGraph.edges) {
                const outwardKey = syntheticToRealKey.get(edge.to);
                const inwardKey = syntheticToRealKey.get(edge.from);
                if (!outwardKey || !inwardKey)
                    continue;
                const linkRes = await api.asApp().requestJira(route `/rest/api/3/issueLink`, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: { name: 'Blocks' },
                        inwardIssue: { key: inwardKey },
                        outwardIssue: { key: outwardKey },
                    }),
                });
                if (linkRes.ok) {
                    createdLinksCount++;
                }
            }
            return {
                mode: 'jira-issues-populated',
                projectKey,
                createdIssuesCount,
                createdLinksCount,
                graph: syntheticGraph,
                message: `Populated ${createdIssuesCount} live Jira issues and ${createdLinksCount} dependency links in project ${projectKey}, and synced the Project Chronos World Model snapshot.`,
            };
        }
    }
    catch (err) {
        console.warn(`[PWM Seeder] Live Jira issue population skipped or unavailable (${err instanceof Error ? err.message : String(err)}); using high-fidelity in-memory snapshot.`);
    }
    return {
        mode: 'in-memory-snapshot',
        projectKey,
        createdIssuesCount,
        createdLinksCount,
        graph: syntheticGraph,
        message: `Loaded "Project Chronos: Next-Gen Platform Launch" snapshot (${syntheticGraph.nodes.length} nodes, ${syntheticGraph.edges.length} causal edges across 3 teams and 2 Teamwork Graph Goals).`,
    };
}


// === Module: ui/components/HeaderBar ===
/**
 * Step 4 Component 1: Header Bar & Judge Controls (`static/ui/src/components/HeaderBar.tsx`)
 *
 * - App title: "Rovo World Model — Causal Time Machine"
 * - Active data badge: "Live Jira + TWG Data" or "Demo Scenario: Project Chronos (18 Nodes)"
 * - "Load Demo Scenario" Button (`invoke('loadDemoScenario')`) & "Create Real Jira Issues" Button
 * - KPI Summary Pills:
 *   1. Baseline P85 Completion Date vs. Simulated P85 Date (with Δ days badge in red/green)
 *   2. Active Critical Bottlenecks count
 *   3. Affected Teamwork Graph Goals count
 */
function escapeHtmlHeader(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function renderHeaderBar(props) {
    const { graph, baselineSim, activeSim, intervention, selectedNodeKey, delayDays, addDeveloper, decoupleBlockingEdges, statusBanner, } = props;
    const p50Shift = intervention ? intervention.p50ShiftDays : 0;
    const p85Shift = intervention ? intervention.p85ShiftDays : 0;
    const p95Shift = intervention ? intervention.p95ShiftDays : 0;
    const hasActiveIntervention = delayDays !== 0 || addDeveloper || decoupleBlockingEdges;
    const dataBadgeLabel = graph.isSyntheticDemo
        ? `Demo Scenario: Project Chronos (${graph.nodes.length} Nodes)`
        : 'Live Jira + TWG Data';
    const affectedGoalsCount = activeSim.goalImpacts.filter((g) => g.status !== 'On Track' || Math.abs(g.rippleDelayDays) > 0).length;
    const formatDeltaBadge = (shift, defaultText) => {
        if (shift > 0) {
            return `<span class="kpi-delta delayed">+${shift}d</span>`;
        }
        if (shift < 0) {
            return `<span class="kpi-delta baseline">${shift}d</span>`;
        }
        return `<span class="kpi-delta baseline">${defaultText}</span>`;
    };
    return `
    <header class="cockpit-header">
      <div class="brand-cluster">
        <div class="brand-orb">RWM</div>
        <div class="brand-titles">
          <h1>
            Rovo-World-Model
            <span class="badge-pill ${graph.isSyntheticDemo ? 'cyan' : 'emerald'}">
              ${escapeHtmlHeader(dataBadgeLabel)}
            </span>
            <span class="badge-pill">Codegeist 2026</span>
          </h1>
          <div class="brand-subtitle">
            Causal AI Digital Twin &amp; Time Machine · Atlassian Teamwork Graph (TWG) · 500-Iteration CRN Monte Carlo ($do$-Calculus)
          </div>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" id="btn-load-demo" title="Load 18-node Project Chronos causal graph">
          ⚡ Load Demo Scenario
        </button>
        <button class="btn" id="btn-create-jira-issues" title="Populate real linked Jira issues via Jira REST API">
          ➕ Create Real Jira Issues
        </button>
        <button class="btn" id="btn-jump-bottleneck">
          🎯 Focus Top Bottleneck (${escapeHtmlHeader(activeSim.topBottlenecks[0]?.key ?? 'CHRON-104')})
        </button>
        <button class="btn ${hasActiveIntervention ? 'btn-danger-outline' : ''}" id="btn-reset-sim">
          ↺ Reset Scenario
        </button>
      </div>
    </header>

    ${statusBanner
        ? `<div class="status-banner-bar">
             <span>✨ ${escapeHtmlHeader(statusBanner)}</span>
             <span style="font-family:var(--font-mono);font-size:11px;color:#67e8f9;">
               Engine Latency: ${activeSim.executionTimeMs} ms / 500 worlds
             </span>
           </div>`
        : ''}

    <!-- KPI SUMMARY PILLS -->
    <section class="kpi-strip">
      <div class="kpi-card ${p85Shift > 0 ? 'highlight-shift' : p85Shift < 0 ? 'highlight-accel' : ''}">
        <div class="kpi-label">
          <span>Baseline vs. Simulated P85 Date</span>
          <span class="badge-pill cyan">85% Commit</span>
        </div>
        <div class="kpi-value">
          ${escapeHtmlHeader(activeSim.p85Date)}
          ${formatDeltaBadge(p85Shift, '0d Shift')}
        </div>
        <div class="kpi-sub">
          Baseline P85: <strong>${escapeHtmlHeader(baselineSim.p85Date)}</strong> (+${baselineSim.p85Days}d)
        </div>
      </div>

      <div class="kpi-card ${p50Shift > 0 ? 'highlight-shift' : p50Shift < 0 ? 'highlight-accel' : ''}">
        <div class="kpi-label">
          <span>P50 Median &amp; P95 Tail Cone</span>
          <span class="badge-pill">P50 / P95</span>
        </div>
        <div class="kpi-value">
          ${escapeHtmlHeader(activeSim.p50Date)}
          ${formatDeltaBadge(p50Shift, 'Baseline')}
        </div>
        <div class="kpi-sub">
          P95 Tail Envelope: <strong>${escapeHtmlHeader(activeSim.p95Date)}</strong> (${p95Shift >= 0 ? `+${p95Shift}d` : `${p95Shift}d`})
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">
          <span>Active Critical Bottlenecks</span>
          <span class="badge-pill amber">Critical Path</span>
        </div>
        <div class="kpi-value">
          ${activeSim.criticalPathNodes.length} Bottlenecks
          <span class="kpi-delta delayed">Top: ${escapeHtmlHeader(activeSim.topBottlenecks[0]?.key ?? 'CHRON-104')}</span>
        </div>
        <div class="kpi-sub">
          Max Ripple Weight: <strong>${activeSim.topBottlenecks[0]?.downstreamRippleWeight ?? 9.5}</strong> (${activeSim.topBottlenecks[0]?.downstreamCount ?? 10} downstream tasks)
        </div>
      </div>

      <div class="kpi-card ${affectedGoalsCount > 0 && p85Shift > 0 ? 'highlight-shift' : ''}">
        <div class="kpi-label">
          <span>Affected Teamwork Graph Goals</span>
          <span class="badge-pill ${affectedGoalsCount > 0 && p85Shift > 0 ? 'rose' : 'emerald'}">TWG Goals</span>
        </div>
        <div class="kpi-value">
          ${affectedGoalsCount} / ${activeSim.goalImpacts.length} Goals
          <span class="kpi-delta ${affectedGoalsCount > 0 && p85Shift > 0 ? 'delayed' : 'baseline'}">
            ${affectedGoalsCount > 0 && p85Shift > 0 ? 'At Risk' : 'Aligned'}
          </span>
        </div>
        <div class="kpi-sub">
          Goals: ${activeSim.goalImpacts.map((g) => `${escapeHtmlHeader(g.goalName)} (${g.status})`).join(' · ')}
        </div>
      </div>

      <div class="kpi-card ${hasActiveIntervention ? 'highlight-shift' : ''}">
        <div class="kpi-label">
          <span>Causal Blast Radius</span>
          <span class="badge-pill cyan">do(${escapeHtmlHeader(selectedNodeKey)})</span>
        </div>
        <div class="kpi-value">
          ${hasActiveIntervention ? `${activeSim.blastRadiusNodes.length} Issues` : '0 Issues'}
          ${formatDeltaBadge(activeSim.rippleDelayDays, 'No Shock')}
        </div>
        <div class="kpi-sub">
          ${hasActiveIntervention
        ? `Propagated across ${graph.teams.length} teams`
        : 'Slide Delay/Accelerate (-5d to +30d) to test'}
        </div>
      </div>
    </section>
  `;
}


// === Module: ui/components/TimelineScrubber ===
/**
 * Step 4 Component 3: Time Machine Scrubber (`static/ui/src/components/TimelineScrubber.tsx`)
 *
 * - Horizontal timeline slider spanning Past Sprints -> Today (State t₀) -> Future Probability Cones (P50, P85, P95).
 * - Dragging the scrubber forward in time dynamically highlights which nodes are expected to be
 *   Done, In Progress, or At Risk / Blocked on that specific future date.
 */
/**
 * Evaluates a node's expected state on any scrubbed day offset `t` (-28d to +65d).
 */
function evaluateNodeTemporalState(node, stat, scrubberDayOffset, hasActiveIntervention) {
    const statusLower = node.status.toLowerCase();
    // At Present State (t === 0), reflect live status + any active blast-radius risk
    if (scrubberDayOffset === 0) {
        if (statusLower === 'done')
            return 'Done';
        if (statusLower === 'blocked' || (hasActiveIntervention && (stat?.rippleDelayDays ?? 0) >= 3)) {
            return 'At Risk / Blocked';
        }
        if (statusLower === 'in progress')
            return 'In Progress';
        return 'Scheduled';
    }
    // Past Sprints (t < 0)
    if (scrubberDayOffset < 0) {
        const completedAgo = node.completedDaysAgo ?? 14;
        if (statusLower === 'done' && scrubberDayOffset >= -completedAgo) {
            return 'Done';
        }
        if (statusLower === 'done' && scrubberDayOffset >= -(completedAgo + 10)) {
            return 'In Progress';
        }
        if (statusLower === 'in progress' && scrubberDayOffset >= -7) {
            return 'In Progress';
        }
        return 'Scheduled';
    }
    // Future Probability Cone (t > 0)
    if (statusLower === 'done')
        return 'Done';
    const p50Start = stat?.p50StartDay ?? 0;
    const p85End = stat?.p85EndDay ?? node.baseEstimateDays;
    const p50End = stat?.p50EndDay ?? node.baseEstimateDays;
    if (scrubberDayOffset >= p85End) {
        return 'Done';
    }
    if (scrubberDayOffset >= p50End && scrubberDayOffset < p85End) {
        // Between P50 and P85 completion window — tail risk / at risk if high sigma or shifted
        if ((stat?.rippleDelayDays ?? 0) > 0 || node.uncertaintySigma >= 1.8 || statusLower === 'blocked') {
            return 'At Risk / Blocked';
        }
        return 'In Progress';
    }
    if (scrubberDayOffset >= p50Start) {
        if (statusLower === 'blocked' || (hasActiveIntervention && (stat?.rippleDelayDays ?? 0) >= 4)) {
            return 'At Risk / Blocked';
        }
        return 'In Progress';
    }
    return 'Scheduled';
}
function escapeHtmlScrubber(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function renderTimelineScrubber(props) {
    const { graph, activeSim, selectedEpochIndex, scrubberDayOffset, hasActiveIntervention, } = props;
    const epochs = activeSim.timeMachineEpochs;
    const currentEpoch = epochs[selectedEpochIndex] ?? epochs[2];
    const scrubbedDate = addCalendarDays(graph.referenceDate, scrubberDayOffset);
    // Dynamically tally node states at the exact `scrubberDayOffset`
    let dynamicDone = 0;
    let dynamicInProgress = 0;
    let dynamicAtRisk = 0;
    let dynamicScheduled = 0;
    for (const node of graph.nodes) {
        const stat = activeSim.nodeStats[node.key];
        const tState = evaluateNodeTemporalState(node, stat, scrubberDayOffset, hasActiveIntervention);
        if (tState === 'Done')
            dynamicDone++;
        else if (tState === 'In Progress')
            dynamicInProgress++;
        else if (tState === 'At Risk / Blocked')
            dynamicAtRisk++;
        else
            dynamicScheduled++;
    }
    const maxBucketProb = Math.max(0.05, ...activeSim.distributionBuckets.map((b) => b.probability));
    return `
    <section class="time-machine-panel">
      <div class="tm-header">
        <div class="tm-title">
          ⏱️ Time Machine Scrubber — Past Sprints → Today (State t₀) → Future Probability Cones (P50 / P85 / P95)
        </div>
        <div style="font-size:11.5px;font-family:var(--font-mono);color:#67e8f9;">
          Scrubbed Date: <strong>${escapeHtmlScrubber(scrubbedDate)}</strong>
          (${scrubberDayOffset >= 0 ? `t₀ + ${scrubberDayOffset}d` : `t₀ ${scrubberDayOffset}d`}) ·
          Epoch: <strong>${escapeHtmlScrubber(currentEpoch.label)}</strong>
        </div>
      </div>

      <div class="epoch-track">
        ${epochs
        .map((ep, idx) => `
            <button class="epoch-node ${idx === selectedEpochIndex ? 'active' : ''}" data-epoch-idx="${idx}">
              <div class="epoch-node-top">
                <span>${ep.dayOffset >= 0 ? `t₀+${ep.dayOffset}d` : `t₀${ep.dayOffset}d`}</span>
                <span>${escapeHtmlScrubber(ep.date)}</span>
              </div>
              <div class="epoch-node-label">${escapeHtmlScrubber(ep.label)}</div>
            </button>
          `)
        .join('')}
      </div>

      <div class="tm-scrubber-row">
        <div class="tm-narrative-box">
          <div class="tm-slider-wrap">
            <span style="font-size:11px;font-family:var(--font-mono);color:var(--text-muted);">Past (-28d)</span>
            <input
              type="range"
              min="-28"
              max="${Math.max(56, Math.ceil(activeSim.p95Days) + 6)}"
              value="${scrubberDayOffset}"
              class="tm-slider"
              id="time-machine-range"
            />
            <span style="font-size:11px;font-family:var(--font-mono);color:var(--text-muted);">P95 (+${Math.ceil(activeSim.p95Days)}d)</span>
          </div>
          <div style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span><strong>State on ${escapeHtmlScrubber(scrubbedDate)}:</strong></span>
            <span class="badge-pill emerald">Done: ${dynamicDone}</span>
            <span class="badge-pill cyan">In Progress: ${dynamicInProgress}</span>
            <span class="badge-pill rose">At Risk / Blocked: ${dynamicAtRisk}</span>
            <span class="badge-pill">Scheduled: ${dynamicScheduled}</span>
            <span style="color:var(--text-muted);">— ${escapeHtmlScrubber(currentEpoch.narrative)}</span>
          </div>
        </div>

        <div>
          <div style="font-size:10.5px;color:var(--text-secondary);margin-bottom:4px;display:flex;justify-content:space-between;">
            <span>Future Probability Cone (500 Worlds)</span>
            <span style="font-family:var(--font-mono);color:#fcd34d;">P85: ${escapeHtmlScrubber(activeSim.p85Date)}</span>
          </div>
          <div class="cone-mini-chart">
            ${activeSim.distributionBuckets
        .map((b) => {
        const heightPct = Math.max(8, Math.round((b.probability / maxBucketProb) * 100));
        const isNearP85 = Math.abs(b.dayOffset - activeSim.p85Days) <= 3;
        const isNearScrub = Math.abs(b.dayOffset - scrubberDayOffset) <= 2;
        return `
                  <div class="cone-bar-col" title="${b.date} (+${b.dayOffset}d): ${Math.round(b.probability * 100)}% density | CDF: ${Math.round(b.cumulativeProbability * 100)}%">
                    <div class="cone-bar ${isNearP85 ? 'p85-marker' : ''} ${isNearScrub ? 'scrub-marker' : ''}" style="height:${heightPct}%;"></div>
                    <span class="cone-bar-label">+${b.dayOffset}d</span>
                  </div>
                `;
    })
        .join('')}
          </div>
        </div>
      </div>
    </section>
  `;
}


// === Module: ui/components/DagCanvas ===
/**
 * Step 4 Component 2: Interactive Causal DAG Canvas (`static/ui/src/components/DagCanvas.tsx`)
 *
 * - Renders an interactive left-to-right Directed Acyclic Graph (SVG + HTML overlay) grouped by Team / Stage.
 * - Color-codes nodes:
 *   1. Critical Path Nodes: Highlighted with an amber/crimson border.
 *   2. Selected / Intervened Node: Glowing cyan/blue indicator (`do(Delay = +X days)`).
 *   3. Downstream Blast Radius Nodes: Pulsing orange/red badge showing exact propagated delay (`+X.X days`).
 * - Dynamically reflects node temporal status when the Time Machine Scrubber is dragged across Past/Today/Future dates.
 */
function escapeHtmlDag(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function computeNodeCoordinates(graph) {
    const coords = {};
    const teamOrder = graph.teams.map((t) => t.name);
    const laneGroups = new Map();
    for (let l = 0; l < Math.max(3, teamOrder.length); l++) {
        laneGroups.set(l, []);
    }
    for (const key of graph.topologicalOrder) {
        const node = graph.nodes.find((n) => n.key === key);
        if (!node)
            continue;
        let laneIdx = teamOrder.indexOf(node.team);
        if (laneIdx < 0)
            laneIdx = 0;
        laneGroups.get(laneIdx).push(key);
    }
    const laneYCenters = [105, 295, 485];
    const xStart = 88;
    const xGap = 148;
    for (const [laneIdx, keys] of laneGroups.entries()) {
        keys.forEach((key, colIdx) => {
            const yBase = laneYCenters[laneIdx % laneYCenters.length];
            const yOffset = colIdx % 2 === 0 ? -12 : 12;
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
function renderDagCanvas(props) {
    const { graph, activeSim, selectedNodeKey, delayDays, addDeveloper, decoupleBlockingEdges, scrubberDayOffset, } = props;
    const coords = computeNodeCoordinates(graph);
    const blastSet = new Set(activeSim.blastRadiusNodes);
    const criticalSet = new Set(activeSim.criticalPathNodes);
    const hasActiveIntervention = delayDays !== 0 || addDeveloper || decoupleBlockingEdges;
    const intervenedKey = hasActiveIntervention ? selectedNodeKey : '';
    const nodeW = 122;
    const nodeH = 58;
    // Swimlane background bands
    const laneBands = graph.teams
        .map((team, idx) => {
        const yTop = idx * 190 + 18;
        return `
        <g>
          <rect x="12" y="${yTop}" width="965" height="174" rx="10"
            fill="rgba(15, 23, 42, 0.45)" stroke="rgba(148, 163, 184, 0.12)" />
          <rect x="12" y="${yTop}" width="5" height="174" rx="2.5" fill="${team.color}" />
          <text x="26" y="${yTop + 20}" fill="${team.color}" font-size="11" font-weight="700" letter-spacing="0.05em">
            TEAM SWIMLANE ${idx + 1}: ${escapeHtmlDag(team.name.toUpperCase())} (Lead: ${escapeHtmlDag(team.lead)})
          </text>
        </g>
      `;
    })
        .join('');
    // Render directed causal edges
    const edgePaths = graph.edges
        .map((edge) => {
        const fromPos = coords[edge.from];
        const toPos = coords[edge.to];
        if (!fromPos || !toPos)
            return '';
        const x1 = fromPos.x + nodeW / 2;
        const y1 = fromPos.y;
        const x2 = toPos.x - nodeW / 2;
        const y2 = toPos.y;
        const dx = Math.max(40, Math.abs(x2 - x1) * 0.48);
        const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
        const isDecoupledEdge = decoupleBlockingEdges && edge.from === selectedNodeKey;
        const isBlastEdge = intervenedKey !== '' &&
            !isDecoupledEdge &&
            (edge.from === intervenedKey || blastSet.has(edge.from)) &&
            blastSet.has(edge.to);
        const isCriticalEdge = criticalSet.has(edge.from) && criticalSet.has(edge.to);
        let edgeClass = 'dag-edge';
        let markerId = 'url(#arrow-default)';
        if (isDecoupledEdge) {
            edgeClass += ' decoupled-edge';
        }
        else if (isBlastEdge) {
            edgeClass += ' blast-edge';
            markerId = 'url(#arrow-blast)';
        }
        else if (isCriticalEdge) {
            edgeClass += ' critical-edge';
            markerId = 'url(#arrow-critical)';
        }
        return `<path d="${pathD}" class="${edgeClass}" marker-end="${markerId}" />`;
    })
        .join('');
    // Render nodes
    const nodeElements = graph.nodes
        .map((node) => {
        const pos = coords[node.key];
        if (!pos)
            return '';
        const stat = activeSim.nodeStats[node.key];
        const isSelected = node.key === selectedNodeKey;
        const isIntervenedOrigin = intervenedKey === node.key;
        const isInBlast = hasActiveIntervention && blastSet.has(node.key);
        const isCritical = criticalSet.has(node.key);
        const temporalState = evaluateNodeTemporalState(node, stat, scrubberDayOffset, hasActiveIntervention);
        let groupClass = 'dag-node-group';
        if (isCritical)
            groupClass += ' critical-node';
        if (isInBlast)
            groupClass += ' in-blast-radius';
        if (isSelected)
            groupClass += ' selected';
        if (isIntervenedOrigin)
            groupClass += ' intervened-origin';
        const xLeft = pos.x - nodeW / 2;
        const yTop = pos.y - nodeH / 2;
        let statusColor = '#64748b';
        if (temporalState === 'Done')
            statusColor = '#10b981';
        else if (temporalState === 'At Risk / Blocked')
            statusColor = '#f43f5e';
        else if (temporalState === 'In Progress')
            statusColor = '#38bdf8';
        const rippleShift = stat?.rippleDelayDays ?? 0;
        // Badge on top-right of node
        let topBadge = '';
        if (isSelected && hasActiveIntervention) {
            const labelText = delayDays > 0
                ? `do(Delay=+${delayDays}d)`
                : delayDays < 0
                    ? `do(Accel=${delayDays}d)`
                    : addDeveloper
                        ? 'do(+1 Dev)'
                        : 'do(Decouple)';
            topBadge = `
          <g transform="translate(${xLeft + nodeW - 76}, ${yTop - 11})">
            <rect width="78" height="17" rx="4" fill="#0284c7" stroke="#38bdf8" stroke-width="1" />
            <text x="39" y="12" text-anchor="middle" fill="#fff" font-size="8.8" font-weight="800" font-family="monospace">
              ${escapeHtmlDag(labelText)}
            </text>
          </g>
        `;
        }
        else if (isInBlast && Math.abs(rippleShift) > 0) {
            const signText = rippleShift > 0 ? `+${rippleShift.toFixed(1)}d` : `${rippleShift.toFixed(1)}d`;
            const fillCol = rippleShift > 0 ? '#9f1239' : '#065f46';
            const strokeCol = rippleShift > 0 ? '#fb7185' : '#34d399';
            topBadge = `
          <g transform="translate(${xLeft + nodeW - 48}, ${yTop - 10})">
            <rect width="48" height="17" rx="4" fill="${fillCol}" stroke="${strokeCol}" stroke-width="1" />
            <text x="24" y="12" text-anchor="middle" fill="#fff" font-size="9.2" font-weight="700" font-family="monospace">
              ${signText}
            </text>
          </g>
        `;
        }
        else if (isCritical) {
            topBadge = `
          <g transform="translate(${xLeft + nodeW - 40}, ${yTop - 9})">
            <rect width="40" height="15" rx="3" fill="rgba(245, 158, 11, 0.25)" stroke="#f59e0b" stroke-width="0.9" />
            <text x="20" y="10.5" text-anchor="middle" fill="#fcd34d" font-size="8.5" font-weight="700" font-family="monospace">
              CRIT
            </text>
          </g>
        `;
        }
        const shortSummary = node.summary.length > 21 ? `${node.summary.slice(0, 20)}…` : node.summary;
        return `
        <g class="${groupClass}" data-node-key="${escapeHtmlDag(node.key)}">
          <rect x="${xLeft}" y="${yTop}" width="${nodeW}" height="${nodeH}" class="dag-node-rect" />
          <circle cx="${xLeft + 11}" cy="${yTop + 14}" r="4.5" fill="${statusColor}" />
          <text x="${xLeft + 20}" y="${yTop + 17}" fill="#f8fafc" font-size="10.5" font-weight="700" font-family="monospace">
            ${escapeHtmlDag(node.key)}
          </text>
          <text x="${xLeft + 9}" y="${yTop + 33}" fill="#cbd5e1" font-size="10">
            ${escapeHtmlDag(shortSummary)}
          </text>
          <text x="${xLeft + 9}" y="${yTop + 48}" fill="#94a3b8" font-size="8.8" font-family="monospace">
            ${escapeHtmlDag(temporalState.split(' ')[0])} · ${node.baseEstimateDays}d±${node.uncertaintySigma}
          </text>
          ${topBadge}
        </g>
      `;
    })
        .join('');
    return `
    <div class="panel-card">
      <div class="panel-header">
        <div class="panel-title">
          🕸️ Interactive Causal DAG Canvas — Grouped by Team &amp; Topological Stage
        </div>
        <div class="dag-legend">
          <span class="legend-item"><span class="legend-dot" style="background:#38bdf8;"></span>Selected / Intervened</span>
          <span class="legend-item"><span class="legend-dot" style="background:#f59e0b;"></span>Critical Path</span>
          <span class="legend-item"><span class="legend-dot" style="background:#f43f5e;"></span>Blast Radius (+Δd)</span>
          <span class="legend-item"><span class="legend-dot" style="background:#10b981;"></span>Done at Scrub Date</span>
        </div>
      </div>
      <div class="dag-viewport">
        <svg viewBox="0 0 990 580" class="dag-svg" id="pwm-dag-svg">
          <defs>
            <marker id="arrow-default" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="rgba(148, 163, 184, 0.55)" />
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
      </div>
    </div>
  `;
}


// === Module: ui/components/ScenarioPanel ===
/**
 * Step 4 Component 4: Counterfactual Intervention Panel (`static/ui/src/components/ScenarioPanel.tsx`)
 *
 * - Displays details of the currently selected node (Key, Summary, Team, Linked Goal, Base Estimate, Uncertainty σ).
 * - "What-If" Intervention Controls ($do$-calculus):
 *   1. Delay / Accelerate Slider: `-5 days` to `+30 days` (triggers instant `runWhatIfSimulation` calculation).
 *   2. Scope / Resource Toggle: Simulate adding a developer (+1 Swarm Resource) or decoupling a blocking edge.
 * - Causal Impact Readout:
 *   1. Side-by-side comparison of Baseline vs. Counterfactual P50 / P85 / P95 completion distribution bars.
 *   2. Top downstream affected tickets + "Copy Rovo Mitigation Prompt" button.
 */
function escapeHtmlScenario(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function buildRovoMitigationPrompt(props) {
    const { graph, selectedNodeKey, delayDays, addDeveloper, decoupleBlockingEdges, activeSim } = props;
    const node = graph.nodes.find((n) => n.key === selectedNodeKey) ?? graph.nodes[0];
    const goal = graph.goals.find((g) => g.id === node.goalId) ?? graph.goals[0];
    const shiftStr = delayDays >= 0 ? `delayed by ${delayDays} days` : `accelerated by ${Math.abs(delayDays)} days`;
    const modifiers = [];
    if (addDeveloper)
        modifiers.push('adding +1 swarm developer');
    if (decoupleBlockingEdges)
        modifiers.push('decoupling outgoing blocking edges');
    const modSuffix = modifiers.length > 0 ? ` while ${modifiers.join(' and ')}` : '';
    return `@Rovo-World-Model Agent Simulate what happens to our "${goal?.name ?? 'Q4 Global Launch'}" goal if ${node.key} ("${node.summary}") on team ${node.team} is ${shiftStr}${modSuffix}. Current simulated P85 date is ${activeSim.p85Date} with ${activeSim.blastRadiusNodes.length} downstream blast-radius issues. Recommend the top dependency to decouple to ship on time with 85% confidence.`;
}
function renderTabBody(props) {
    const { activeRightTab, activeSim, intervention, graph, selectedNodeKey, delayDays, addDeveloper, decoupleBlockingEdges, } = props;
    const hasActiveIntervention = delayDays !== 0 || addDeveloper || decoupleBlockingEdges;
    if (activeRightTab === 'cascade') {
        const deltas = intervention?.nodeDeltas.filter((d) => d.key !== selectedNodeKey && Math.abs(d.shiftDays) > 0) ?? [];
        if (!hasActiveIntervention || deltas.length === 0) {
            return `
        <div style="padding: 12px 6px; color: var(--text-secondary); font-size: 12px;">
          Adjust the <strong>Delay / Accelerate Slider (-5d to +30d)</strong> or toggle <strong>Add Developer / Decouple Edge</strong> above to inspect downstream ticket shifts across teams.
        </div>
      `;
        }
        const rows = deltas
            .map((d) => {
            const signStr = d.shiftDays > 0 ? `+${d.shiftDays}d` : `${d.shiftDays}d`;
            const deltaClass = d.shiftDays > 0 ? 'delayed' : 'baseline';
            return `
          <tr data-select-node="${escapeHtmlScenario(d.key)}" style="cursor:pointer;">
            <td><strong style="font-family:var(--font-mono);color:#38bdf8;">${escapeHtmlScenario(d.key)}</strong></td>
            <td>${escapeHtmlScenario(d.summary.slice(0, 30))}${d.summary.length > 30 ? '…' : ''}</td>
            <td><span class="badge-pill">${escapeHtmlScenario(d.team)}</span></td>
            <td style="font-family:var(--font-mono);">${escapeHtmlScenario(d.intervenedP85Date)}</td>
            <td><span class="kpi-delta ${deltaClass}">${signStr}</span></td>
          </tr>
        `;
        })
            .join('');
        return `
      <table class="cascade-table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Downstream Summary</th>
            <th>Team</th>
            <th>Sim P85</th>
            <th>Causal Δ</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    }
    if (activeRightTab === 'bottlenecks') {
        return activeSim.topBottlenecks
            .slice(0, 5)
            .map((b, idx) => `
        <div class="bottleneck-item" data-select-node="${escapeHtmlScenario(b.key)}">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span>
              <strong style="font-family:var(--font-mono);color:#a5b4fc;">#${idx + 1} ${escapeHtmlScenario(b.key)}</strong>
              — <strong style="font-size:12px;">${escapeHtmlScenario(b.summary)}</strong>
            </span>
            <span class="badge-pill rose">Ripple Wt: ${b.downstreamRippleWeight}</span>
          </div>
          <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;font-family:var(--font-mono);">
            Team: ${escapeHtmlScenario(b.team)} · Criticality: ${Math.round(b.criticalityIndex * 100)}% · Fanout: ${b.downstreamCount} · Risk: ${b.riskScore}/100
          </div>
          <div style="font-size:11px;color:#67e8f9;margin-top:4px;">
            💡 ${escapeHtmlScenario(b.recommendation)}
          </div>
        </div>
      `)
            .join('');
    }
    const mcpRpcSample = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
            name: 'pwm_simulate_intervention',
            arguments: {
                projectKey: graph.projectKey,
                issueKey: selectedNodeKey,
                delayDays,
                addDeveloper,
                decoupleBlockingEdges,
            },
        },
        resultPreview: {
            p50Date: activeSim.p50Date,
            p85Date: activeSim.p85Date,
            p95Date: activeSim.p95Date,
            rippleDelayDays: activeSim.rippleDelayDays,
            blastRadiusCount: activeSim.blastRadiusNodes.length,
            registeredMcpTools: MCP_TOOLS_MANIFEST.map((t) => t.name),
        },
    };
    return `
    <div style="display:flex;flex-direction:column;gap:8px;">
      <div style="font-size:11.5px;color:var(--text-secondary);">
        <strong>Rovo-World-Model Agent (<code>rovo-world-model-agent</code>)</strong> &amp; <strong>MCP Endpoint (<code>mcp-world-model-endpoint</code>)</strong> live JSON-RPC payload:
      </div>
      <pre class="code-console">${escapeHtmlScenario(JSON.stringify(mcpRpcSample, null, 2))}</pre>
    </div>
  `;
}
function renderScenarioPanel(props) {
    const { graph, baselineSim, activeSim, selectedNodeKey, delayDays, addDeveloper, decoupleBlockingEdges, activeRightTab, copiedPromptNotice, } = props;
    const selectedNode = graph.nodes.find((n) => n.key === selectedNodeKey) ?? graph.nodes[0];
    const selectedStat = activeSim.nodeStats[selectedNode.key];
    const linkedGoal = graph.goals.find((g) => g.id === selectedNode.goalId) ?? graph.goals[0];
    const maxTimelineScale = Math.max(65, baselineSim.p95Days + 10, activeSim.p95Days + 10);
    const pct = (days) => Math.min(100, Math.max(6, Math.round((days / maxTimelineScale) * 100)));
    const delaySignLabel = delayDays > 0
        ? `+${delayDays} Days (Delay)`
        : delayDays < 0
            ? `${delayDays} Days (Accelerate)`
            : '0 Days (Baseline)';
    return `
    <div class="right-column">
      <!-- Counterfactual Intervention Controls Card -->
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-title">
            🎛️ Scenario Intervention Panel ($do$-Calculus)
          </div>
          <span class="badge-pill ${delayDays > 0 ? 'rose' : delayDays < 0 ? 'emerald' : 'cyan'}">
            do(${escapeHtmlScenario(selectedNode.key)} = ${delayDays >= 0 ? `+${delayDays}d` : `${delayDays}d`})
          </span>
        </div>

        <div class="intervention-box">
          <!-- Selected Node Details -->
          <div class="selected-node-banner">
            <div class="node-banner-top">
              <span class="node-key-tag">${escapeHtmlScenario(selectedNode.key)} · ${escapeHtmlScenario(selectedNode.status)}</span>
              <span class="badge-pill">${escapeHtmlScenario(selectedNode.team)}</span>
            </div>
            <div class="node-summary-text">${escapeHtmlScenario(selectedNode.summary)}</div>
            <div class="node-meta-grid">
              <div class="meta-cell">
                <span>Linked Goal</span>
                <strong>${escapeHtmlScenario(linkedGoal?.name ?? selectedNode.goalId)}</strong>
              </div>
              <div class="meta-cell">
                <span>Base Estimate</span>
                <strong>${selectedNode.baseEstimateDays} Days</strong>
              </div>
              <div class="meta-cell">
                <span>Uncertainty σ</span>
                <strong>±${selectedNode.uncertaintySigma} Days</strong>
              </div>
              <div class="meta-cell">
                <span>Criticality</span>
                <strong>${Math.round((selectedStat?.criticalityIndex ?? 0) * 100)}%</strong>
              </div>
            </div>
            ${selectedNode.confluenceDecision
        ? `<div style="margin-top:7px;padding-top:6px;border-top:1px dashed var(--border-subtle);font-size:10.5px;color:#a5b4fc;font-family:var(--font-mono);">
                     📄 TWG Confluence Decision: <strong>${escapeHtmlScenario(selectedNode.confluenceDecision.title)}</strong> (${escapeHtmlScenario(selectedNode.confluenceDecision.spaceKey)})
                   </div>`
        : ''}
          </div>

          <!-- Delay / Accelerate Slider (-5d to +30d) -->
          <div class="delay-slider-card">
            <div class="slider-header">
              <span class="slider-title">Delay / Accelerate Slider (-5d to +30d)</span>
              <span class="slider-readout ${delayDays < 0 ? 'accel-text' : ''}">${delaySignLabel}</span>
            </div>
            <input
              type="range"
              min="-5"
              max="30"
              step="1"
              value="${delayDays}"
              class="delay-range-input"
              id="delay-slider-input"
            />
            <div class="preset-row">
              ${[-5, -3, 0, 5, 10, 18, 30]
        .map((val) => `
                  <button class="preset-btn ${delayDays === val ? 'active' : ''}" data-preset-delay="${val}">
                    ${val === 0 ? '0d' : val > 0 ? `+${val}d` : `${val}d`}
                  </button>
                `)
        .join('')}
            </div>

            <!-- Scope / Resource Toggles -->
            <div class="scope-toggles-row">
              <button
                class="scope-toggle-btn ${addDeveloper ? 'active' : ''}"
                id="btn-toggle-add-dev"
                title="Simulate swarming +1 developer (-35% base duration, -40% uncertainty σ)"
              >
                👩‍💻 ${addDeveloper ? '✓ Added Swarm Developer (-35% Est)' : 'Add Developer (+1 Resource)'}
              </button>
              <button
                class="scope-toggle-btn ${decoupleBlockingEdges ? 'active' : ''}"
                id="btn-toggle-decouple-edge"
                title="Simulate decoupling outgoing blocking edges (reduces propagation weight to 0.25)"
              >
                ✂️ ${decoupleBlockingEdges ? '✓ Blocking Edge Decoupled' : 'Decouple Blocking Edge'}
              </button>
            </div>
          </div>

          <!-- Side-by-Side Baseline vs Counterfactual P50 / P85 / P95 Distribution Bars -->
          <div class="comparison-bars-card">
            <div style="font-size:11.5px;font-weight:700;margin-bottom:8px;display:flex;justify-content:space-between;">
              <span>📊 Baseline vs. Counterfactual Distribution (P50 / P85 / P95)</span>
              <span style="font-family:var(--font-mono);font-size:10.5px;color:var(--text-secondary);">500 CRN Worlds</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:6px;margin-bottom:6px;font-size:10px;font-family:var(--font-mono);color:#94a3b8;background:rgba(30,41,59,0.55);padding:5px 8px;border-radius:6px;">
              <span>CVaR₀.₉₅: <strong style="color:#fda4af;">${escapeHtmlScenario(activeSim.cvar95Date)} (+${activeSim.cvar95Days}d)</strong></span>
              <span>Latent Energy E: <strong style="color:#67e8f9;">${activeSim.quasimetricEnergy}</strong></span>
              <span>Rework Risk: <strong style="color:#fcd34d;">${activeSim.estimatedReworkHours}h</strong></span>
            </div>

            ${['P50', 'P85', 'P95']
        .map((metric) => {
        const baseDays = metric === 'P50'
            ? baselineSim.p50Days
            : metric === 'P85'
                ? baselineSim.p85Days
                : baselineSim.p95Days;
        const intDays = metric === 'P50'
            ? activeSim.p50Days
            : metric === 'P85'
                ? activeSim.p85Days
                : activeSim.p95Days;
        const baseDate = metric === 'P50'
            ? baselineSim.p50Date
            : metric === 'P85'
                ? baselineSim.p85Date
                : baselineSim.p95Date;
        const intDate = metric === 'P50'
            ? activeSim.p50Date
            : metric === 'P85'
                ? activeSim.p85Date
                : activeSim.p95Date;
        const diff = Number((intDays - baseDays).toFixed(1));
        const intBarColor = diff > 0 ? '#f43f5e' : diff < 0 ? '#10b981' : '#38bdf8';
        return `
                  <div class="dist-compare-group">
                    <div class="dist-compare-label">
                      <strong>${metric}</strong>
                      <span>Base: ${baseDate} (${baseDays}d) vs. Sim: <strong>${intDate} (${intDays}d)</strong></span>
                    </div>
                    <div class="dual-bar-stack">
                      <div class="bar-track-line">
                        <div class="bar-fill-base" style="width:${pct(baseDays)}%;"></div>
                      </div>
                      <div class="bar-track-line">
                        <div class="bar-fill-sim" style="width:${pct(intDays)}%;background:${intBarColor};"></div>
                      </div>
                    </div>
                  </div>
                `;
    })
        .join('')}

            <button class="btn btn-rovo-copy" id="btn-copy-rovo-prompt">
              ${copiedPromptNotice ? '✓ Copied Rovo Mitigation Prompt to Clipboard!' : '📋 Copy Rovo Mitigation Prompt'}
            </button>
          </div>
        </div>
      </div>

      <!-- Atlassian Teamwork Graph (TWG) Goals Impact Card -->
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-title">
            🧭 Atlassian Teamwork Graph (TWG) Goals
          </div>
          <span class="badge-pill cyan">${activeSim.goalImpacts.length} Goals</span>
        </div>
        <div class="goals-list">
          ${activeSim.goalImpacts
        .map((goal) => {
        const statusClass = goal.status === 'Off Track'
            ? 'off-track'
            : goal.status === 'At Risk'
                ? 'at-risk'
                : '';
        const pillVariant = goal.status === 'Off Track'
            ? 'rose'
            : goal.status === 'At Risk'
                ? 'amber'
                : 'emerald';
        const probPct = Math.round(goal.probabilityOfOnTime * 100);
        const barColor = goal.status === 'Off Track'
            ? '#f43f5e'
            : goal.status === 'At Risk'
                ? '#f59e0b'
                : '#10b981';
        const shiftSign = goal.rippleDelayDays > 0
            ? `+${goal.rippleDelayDays}d`
            : goal.rippleDelayDays < 0
                ? `${goal.rippleDelayDays}d`
                : '';
        return `
                <div class="goal-card ${statusClass}">
                  <div class="goal-top">
                    <div>
                      <div style="font-size:10.5px;font-family:var(--font-mono);color:var(--text-secondary);">
                        ${escapeHtmlScenario(goal.goalKey)} · Team: ${escapeHtmlScenario(goal.ownerTeam)}
                      </div>
                      <div class="goal-name">${escapeHtmlScenario(goal.goalName)}</div>
                    </div>
                    <span class="badge-pill ${pillVariant}">${escapeHtmlScenario(goal.status)}</span>
                  </div>
                  <div class="goal-dates-row">
                    <span>Target: <strong>${escapeHtmlScenario(goal.targetDate)}</strong></span>
                    <span>Sim P85: <strong>${escapeHtmlScenario(goal.p85CompletionDate)}</strong> ${shiftSign ? `<em style="color:${goal.rippleDelayDays > 0 ? '#fb7185' : '#34d399'};">(${shiftSign})</em>` : ''}</span>
                    <span>On-Time: <strong>${probPct}%</strong></span>
                  </div>
                  <div class="prob-bar-track">
                    <div class="prob-bar-fill" style="width:${probPct}%;background:${barColor};"></div>
                  </div>
                </div>
              `;
    })
        .join('')}
        </div>
      </div>

      <!-- Downstream Affected Tickets & Bottlenecks & Rovo/MCP Tabs -->
      <div class="panel-card">
        <div class="tab-bar">
          <button class="tab-btn ${activeRightTab === 'cascade' ? 'active' : ''}" data-tab="cascade">
            🌊 Downstream Tickets (${activeSim.blastRadiusNodes.length})
          </button>
          <button class="tab-btn ${activeRightTab === 'bottlenecks' ? 'active' : ''}" data-tab="bottlenecks">
            🚧 Top Bottlenecks (${activeSim.topBottlenecks.length})
          </button>
          <button class="tab-btn ${activeRightTab === 'rovo-mcp' ? 'active' : ''}" data-tab="rovo-mcp">
            🤖 Rovo &amp; MCP Spec
          </button>
        </div>
        <div class="tab-body">
          ${renderTabBody(props)}
        </div>
      </div>
    </div>
  `;
}


// === Module: ui/cockpit ===
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
/**
 * Helper to invoke Atlassian Forge Custom UI resolver (`@forge/bridge`) when running inside Jira Cloud,
 * with seamless local mock fallback during browser development.
 */
async function invokeForgeResolver(functionKey, payload = {}) {
    try {
        const win = window;
        if (win.__forgeBridge && typeof win.__forgeBridge.invoke === 'function') {
            return await win.__forgeBridge.invoke(functionKey, payload);
        }
    }
    catch {
        // Fallback to local engine
    }
    return null;
}
const initialGraph = getChronosSyntheticGraph('CHRON');
const initialBaseline = runMonteCarloSimulation(initialGraph, { iterations: 500 });
const initialIntervention = runIntervention(initialGraph, 'CHRON-104', 8, {
    iterations: 500,
});
const state = {
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
    statusBanner: 'Active Scenario: "Project Chronos: Next-Gen Platform Launch" (18 Nodes across Core Engine, Cloud Infra, Client UI · 2 TWG Goals: Zero-Downtime Migration & Q4 Global Launch)',
};
function recomputeSimulation() {
    state.baselineSim = runMonteCarloSimulation(state.graph, { iterations: 500 });
    const hasIntervention = state.delayDays !== 0 || state.addDeveloper || state.decoupleBlockingEdges;
    if (hasIntervention && state.selectedNodeKey) {
        const intResult = runIntervention(state.graph, state.selectedNodeKey, state.delayDays, {
            iterations: 500,
            addDeveloper: state.addDeveloper,
            decoupleBlockingEdges: state.decoupleBlockingEdges,
        });
        state.intervention = intResult;
        state.activeSim = intResult;
    }
    else {
        state.intervention = null;
        state.activeSim = state.baselineSim;
    }
}
function renderCockpit() {
    const root = document.getElementById('app-root');
    if (!root)
        return;
    const hasActiveIntervention = state.delayDays !== 0 || state.addDeveloper || state.decoupleBlockingEdges;
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
function attachCockpitEventListeners() {
    const triggerRemoteWhatIf = () => {
        void invokeForgeResolver('runWhatIfSimulation', {
            targetNodeId: state.selectedNodeKey,
            deltaDays: state.delayDays,
            addDeveloper: state.addDeveloper,
            decoupleBlockingEdges: state.decoupleBlockingEdges,
        });
    };
    // 1. Node click on SVG DAG
    document.querySelectorAll('.dag-node-group').forEach((el) => {
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
    const delaySlider = document.getElementById('delay-slider-input');
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
    document.querySelectorAll('[data-preset-delay]').forEach((btn) => {
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
            }
            catch {
                // Fallback when clipboard permission is restricted in sandboxed iframe
            }
            state.copiedPromptNotice = true;
            state.statusBanner = `Copied Rovo Mitigation Prompt: "${promptText.slice(0, 95)}…"`;
            renderCockpit();
        });
    }
    // 7. Time Machine Epoch Buttons
    document.querySelectorAll('[data-epoch-idx]').forEach((btn) => {
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
    const tmSlider = document.getElementById('time-machine-range');
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
            const res = await invokeForgeResolver('createRealJiraIssues', { projectKey: state.graph.projectKey });
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
            if (state.delayDays === 0)
                state.delayDays = 8;
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
    document.querySelectorAll('[data-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            if (tab) {
                state.activeRightTab = tab;
                renderCockpit();
            }
        });
    });
    // 14. Clickable rows in Cascade / Bottlenecks list
    document.querySelectorAll('[data-select-node]').forEach((row) => {
        row.addEventListener('click', () => {
            const key = row.getAttribute('data-select-node');
            if (key) {
                state.selectedNodeKey = key;
                if (state.delayDays === 0)
                    state.delayDays = 7;
                recomputeSimulation();
                renderCockpit();
            }
        });
    });
}
// Initialize on DOM load + sync with Forge Backend Resolver (`getGraphData`)
document.addEventListener('DOMContentLoaded', async () => {
    renderCockpit();
    const remoteData = await invokeForgeResolver('getGraphData', {});
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

})();
