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
 * Zero-dependency TypeScript types for Atlassian Forge (nodejs22.x).
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
 * Computes 3-Point PERT Beta expected duration (mean M) and standard deviation (sigma)
 * when `optimisticDays` (Min), `mostLikelyDays` (ML), and `pessimisticDays` (Max) are present.
 * Formula: M = (Min + 4 * ML + Max) / 6, Sigma = (Max - Min) / 6.
 */
function computePertParameters(node) {
    const hasPert = typeof node.optimisticDays === 'number' &&
        typeof node.mostLikelyDays === 'number' &&
        typeof node.pessimisticDays === 'number' &&
        node.pessimisticDays >= node.optimisticDays;
    if (hasPert) {
        const minD = Math.max(0.25, node.optimisticDays);
        const mlD = Math.max(minD, node.mostLikelyDays);
        const maxD = Math.max(mlD, node.pessimisticDays);
        const meanDays = Number(((minD + 4 * mlD + maxD) / 6).toFixed(2));
        const sigmaDays = Number(Math.max(0.1, (maxD - minD) / 6).toFixed(2));
        return { meanDays, sigmaDays, isPertActive: true };
    }
    return {
        meanDays: Math.max(0.5, node.baseEstimateDays),
        sigmaDays: Math.max(0.1, node.uncertaintySigma),
        isPertActive: false,
    };
}
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
                precedenceType: edge.precedenceType ?? existing?.precedenceType ?? 'FS',
                lagDays: edge.lagDays ?? existing?.lagDays ?? 0,
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
 * Total Float (`slackDays`), Forced-Deadline Signed Float (`totalFloatDays`),
 * transitive downstream dependency count, and cumulative downstream ripple weight.
 * Supports all 4 precedence types (`FS`, `SS`, `FF`, `SF`) and lead/lag (`lagDays`).
 */
function computeDeterministicCriticalPath(graph, forcedTargetDays) {
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
        const pert = computePertParameters(node);
        return Math.max(0.5, pert.meanDays);
    };
    // Forward pass supporting FS, SS, FF, SF precedence and lagDays
    const ES = new Map();
    const EF = new Map();
    for (const key of topo) {
        const node = nodeMap.get(key);
        const dur = effectiveDuration(node);
        const preds = incoming.get(key) ?? [];
        let maxPredStart = 0;
        for (const edge of preds) {
            const predES = ES.get(edge.from) ?? 0;
            const predEF = EF.get(edge.from) ?? 0;
            const predDur = Math.max(0, predEF - predES);
            const pType = edge.precedenceType ?? 'FS';
            const lag = edge.lagDays ?? 0;
            let candidateStart = 0;
            if (pType === 'SS') {
                candidateStart = predES + lag;
            }
            else if (pType === 'FF') {
                candidateStart = Math.max(0, predEF + lag - dur);
            }
            else if (pType === 'SF') {
                candidateStart = Math.max(0, predES + lag - dur);
            }
            else {
                // Default FS (Finish-to-Start)
                candidateStart = predES + predDur * edge.propagationWeight + lag;
            }
            if (candidateStart > maxPredStart) {
                maxPredStart = candidateStart;
            }
        }
        const startVal = Math.max(0, maxPredStart);
        ES.set(key, startVal);
        EF.set(key, startVal + dur);
    }
    let projectDuration = 0;
    for (const ef of EF.values()) {
        if (ef > projectDuration) {
            projectDuration = ef;
        }
    }
    // Determine forced deadline for negative float detection (anchored to goal target if available)
    const goalOffsetById = new Map();
    for (const g of graph.goals) {
        if (g.targetDayOffset > 0) {
            goalOffsetById.set(g.id, g.targetDayOffset);
        }
    }
    const earliestGoalOffset = graph.goals.length > 0
        ? Math.min(...graph.goals.map((g) => g.targetDayOffset).filter((d) => d > 0), projectDuration)
        : projectDuration;
    const targetDeadlineDays = typeof forcedTargetDays === 'number' && Number.isFinite(forcedTargetDays)
        ? forcedTargetDays
        : earliestGoalOffset > 0
            ? earliestGoalOffset
            : projectDuration;
    // Backward pass + transitive downstream count
    const LS = new Map();
    const LF = new Map();
    const forcedLS = new Map();
    const downstreamSets = new Map();
    for (let i = topo.length - 1; i >= 0; i--) {
        const key = topo[i];
        const node = nodeMap.get(key);
        const dur = effectiveDuration(node);
        const succs = outgoing.get(key) ?? [];
        const ds = new Set();
        const nodeGoalDeadline = typeof forcedTargetDays === 'number' && Number.isFinite(forcedTargetDays)
            ? forcedTargetDays
            : goalOffsetById.get(node.goalId) ?? targetDeadlineDays;
        if (succs.length === 0) {
            LF.set(key, projectDuration);
            LS.set(key, Math.max(0, projectDuration - dur));
            forcedLS.set(key, nodeGoalDeadline - dur);
        }
        else {
            let minSuccStart = projectDuration;
            let minForcedFinish = nodeGoalDeadline;
            for (const edge of succs) {
                ds.add(edge.to);
                const childDs = downstreamSets.get(edge.to);
                if (childDs) {
                    for (const item of childDs) {
                        ds.add(item);
                    }
                }
                const lag = edge.lagDays ?? 0;
                const succLS = LS.get(edge.to) ?? projectDuration;
                const effectiveConstraint = edge.propagationWeight > 0 ? (succLS - lag) / edge.propagationWeight : succLS - lag;
                const boundedConstraint = Math.min(projectDuration, effectiveConstraint);
                if (boundedConstraint < minSuccStart) {
                    minSuccStart = boundedConstraint;
                }
                const succForcedLS = forcedLS.get(edge.to) ?? targetDeadlineDays;
                const forcedConstraint = succForcedLS - lag;
                if (forcedConstraint < minForcedFinish) {
                    minForcedFinish = forcedConstraint;
                }
            }
            LF.set(key, minSuccStart);
            LS.set(key, Math.max(0, minSuccStart - dur));
            forcedLS.set(key, minForcedFinish - dur);
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
        const fLS = forcedLS.get(key) ?? ls;
        const totalFloatDays = Number((fLS - es).toFixed(2));
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
            totalFloatDays,
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
        const pertLabel = labels.find((l) => l.toLowerCase().startsWith('pert:'));
        let optimisticDays;
        let mostLikelyDays;
        let pessimisticDays;
        if (pertLabel) {
            const parts = pertLabel
                .slice(5)
                .split('-')
                .map((v) => Number(v.trim()));
            if (parts.length === 3 && parts.every((n) => Number.isFinite(n) && n > 0)) {
                optimisticDays = parts[0];
                mostLikelyDays = parts[1];
                pessimisticDays = parts[2];
                baseEstimateDays = Number(((optimisticDays + 4 * mostLikelyDays + pessimisticDays) / 6).toFixed(1));
                uncertaintySigma = Number(Math.max(0.2, (pessimisticDays - optimisticDays) / 6).toFixed(2));
            }
        }
        const assignedTeam = teamLabel
            ? teamLabel.slice(5)
            : defaultTeams[index % defaultTeams.length].name;
        const assignedGoalId = goalLabel
            ? goalLabel.slice(5).toUpperCase()
            : defaultGoals[index < Math.ceil(rawIssues.length * 0.55) ? 0 : 1].id;
        const issueTypeName = issue.fields.issuetype?.name || 'Task';
        const isStageGate = issueTypeName.toLowerCase() === 'milestone' ||
            issueTypeName.toLowerCase() === 'gate' ||
            (issue.fields.summary ?? '').toLowerCase().includes('gate');
        const normalizedStat = normalizeStatus(statusName);
        const plannedEffortDays = baseEstimateDays;
        const actualEffortDays = normalizedStat === 'Done'
            ? baseEstimateDays
            : normalizedStat === 'In Progress'
                ? Number((baseEstimateDays * 0.55).toFixed(1))
                : normalizedStat === 'Blocked'
                    ? Number((baseEstimateDays * 0.4).toFixed(1))
                    : 0;
        nodes.push({
            id: issue.id || issue.key,
            key: issue.key,
            summary: issue.fields.summary || `Untitled Issue ${issue.key}`,
            status: normalizedStat,
            baseEstimateDays,
            uncertaintySigma,
            optimisticDays,
            mostLikelyDays,
            pessimisticDays,
            plannedEffortDays,
            actualEffortDays,
            isStageGate,
            assignee: issue.fields.assignee?.displayName || 'Unassigned',
            team: assignedTeam,
            goalId: assignedGoalId,
            issueType: issueTypeName,
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
    const nodeKeySet = new Set(nodes.map((n) => n.key));
    const internalEdgesCount = rawEdges.filter((e) => nodeKeySet.has(e.from) && nodeKeySet.has(e.to) && e.from !== e.to).length;
    if (internalEdgesCount === 0 && nodes.length > 1) {
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
 * Computes the objective step-function completion percentage (0%, 25%, 50%, 75%, 100%)
 * where the final 75% -> 100% transition requires downstream handoff acceptance when
 * the task gates a downstream dependent task.
 */
function computeNodeCompletionStepPct(node, outgoingEdges, nodeByKey) {
    const statusLower = node.status.toLowerCase();
    if (statusLower === 'done' || statusLower === 'completed' || statusLower === 'closed') {
        if (node.handoffAcceptedByDownstream === false) {
            return 75;
        }
        if (node.handoffAcceptedByDownstream === true) {
            return 100;
        }
        const hasUnacceptedCrossTeamHandoff = outgoingEdges.some((edge) => {
            const target = nodeByKey.get(edge.to);
            if (!target)
                return false;
            const isCrossTeam = target.team !== node.team || edge.dependencyType === 'Cross-Team Handoff';
            return isCrossTeam && target.status.toLowerCase() === 'to do' && edge.propagationWeight >= 0.95 && node.handoffAcceptedByDownstream !== undefined;
        });
        return hasUnacceptedCrossTeamHandoff ? 75 : 100;
    }
    if (statusLower.includes('review') || statusLower.includes('qa')) {
        return 75;
    }
    if (statusLower.includes('progress')) {
        return 50;
    }
    if (statusLower.includes('block')) {
        return 25;
    }
    return 0;
}
/**
 * Computes Brooks's Law onboarding drag and communication channel complexity N = n(n-1)/2
 * when adding +1 developer to a squad working on `node`.
 */
function computeBrooksLawMetrics(node) {
    const n = Math.max(2, node.teamSize ?? 3);
    const communicationChannelsBefore = (n * (n - 1)) / 2;
    const communicationChannelsAfter = ((n + 1) * n) / 2;
    const deltaChannels = communicationChannelsAfter - communicationChannelsBefore;
    const pert = computePertParameters(node);
    const base = Math.max(0.5, pert.meanDays);
    const onboardingPenaltyDays = Number(Math.min(1.2, 0.08 * base + 0.06 * deltaChannels).toFixed(2));
    const parallelCompressed = base * 0.65;
    const appliedOnboarding = base <= 2.0 ? onboardingPenaltyDays : onboardingPenaltyDays * 0.35;
    const effectiveSwarmDurationDays = Number(Math.max(0.5, parallelCompressed + appliedOnboarding).toFixed(2));
    const netAccelerationDays = Number((base - effectiveSwarmDurationDays).toFixed(2));
    let warning;
    if (base <= 2.5) {
        warning = `Short task (${base}d): +${onboardingPenaltyDays}d mentoring & coordination overhead (${communicationChannelsBefore} -> ${communicationChannelsAfter} channels) reduces parallel speedup.`;
    }
    return {
        communicationChannelsBefore,
        communicationChannelsAfter,
        onboardingPenaltyDays,
        netAccelerationDays,
        effectiveSwarmDurationDays,
        warning,
    };
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
    // Pre-index incoming and outgoing edges for each topological index
    const predIndices = Array.from({ length: n }, () => []);
    const predWeights = Array.from({ length: n }, () => []);
    const predTypes = Array.from({ length: n }, () => []);
    const predLags = Array.from({ length: n }, () => []);
    const outgoingByKey = new Map();
    for (const node of orderedNodes) {
        outgoingByKey.set(node.key, []);
    }
    for (const edge of effectiveEdges) {
        outgoingByKey.get(edge.from)?.push(edge);
        const uIdx = keyToIndex.get(edge.from);
        const vIdx = keyToIndex.get(edge.to);
        if (uIdx !== undefined && vIdx !== undefined) {
            predIndices[vIdx].push(uIdx);
            predWeights[vIdx].push(edge.propagationWeight);
            predTypes[vIdx].push(edge.precedenceType ?? 'FS');
            predLags[vIdx].push(edge.lagDays ?? 0);
        }
    }
    // Detect parallel assignee contention across active non-Done tasks
    const assigneeActiveTasks = new Map();
    for (const node of orderedNodes) {
        if (node.status.toLowerCase() !== 'done' &&
            node.assignee &&
            node.assignee.toLowerCase() !== 'unassigned') {
            const list = assigneeActiveTasks.get(node.assignee) ?? [];
            list.push(node.key);
            assigneeActiveTasks.set(node.assignee, list);
        }
    }
    // Deterministic CPM metrics (slack, totalFloat, downstream counts, ripple weights)
    const cpmMetrics = computeDeterministicCriticalPath(effectiveGraph);
    // Precompute PERT parameters per node
    const nodePert = orderedNodes.map((node) => computePertParameters(node));
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
            const pert = nodePert[i];
            const isTarget = node.key === intervenedKey;
            const isDone = node.status.toLowerCase() === 'done';
            // Sample stochastic task duration using right-skewed normal noise
            const z = sampleStandardNormal(rng);
            let sampledDuration = 0;
            if (!isDone || (isTarget && (interventionDelta !== 0 || addDeveloper))) {
                let base = isDone ? 0 : pert.meanDays;
                let sigma = isDone ? 0.25 : pert.sigmaDays;
                // Multi-tasking fragmentation / overload adjustment if explicitly configured
                if (typeof node.allocationRatio === 'number') {
                    if (node.allocationRatio < 0.2) {
                        sigma *= 1.25;
                    }
                    else if (node.allocationRatio > 1.1) {
                        sigma *= 1.2;
                    }
                }
                if (isTarget && addDeveloper) {
                    const brooks = computeBrooksLawMetrics(node);
                    base = brooks.effectiveSwarmDurationDays;
                    sigma = Math.max(0.1, sigma * 0.6);
                }
                // Right-skewed software engineering tail distribution
                const skewNoise = z >= 0 ? z * sigma * 1.28 : z * sigma * 0.62;
                let rawDuration = Math.max(base * 0.35, base + skewNoise);
                // Discrete Pure Risk Events (Bernoulli shocks)
                if (node.pureRisks && node.pureRisks.length > 0) {
                    for (const risk of node.pureRisks) {
                        const u = rng();
                        if (u < Math.max(0, Math.min(1, risk.probability))) {
                            rawDuration += Math.max(0, risk.delayImpactDays);
                        }
                    }
                }
                const shiftedDuration = rawDuration + (isTarget ? interventionDelta : 0);
                sampledDuration = isDone && interventionDelta <= 0 ? 0 : Math.max(0.5, shiftedDuration);
            }
            // Compute earliest start time gated by upstream predecessors (FS, SS, FF, SF + lagDays)
            const pIdxList = predIndices[i];
            const pWeightList = predWeights[i];
            const pTypeList = predTypes[i];
            const pLagList = predLags[i];
            let earliestStart = 0;
            let chosenPred = -1;
            for (let p = 0; p < pIdxList.length; p++) {
                const uIdx = pIdxList[p];
                const w = pWeightList[p];
                const pType = pTypeList[p];
                const lag = pLagList[p];
                const uStart = trialStart[uIdx];
                const uEnd = trialEnd[uIdx];
                const uDur = Math.max(0, uEnd - uStart);
                let candidateStart = 0;
                if (pType === 'SS') {
                    candidateStart = Math.max(0, uStart + lag);
                }
                else if (pType === 'FF') {
                    candidateStart = Math.max(0, uEnd + lag - sampledDuration);
                }
                else if (pType === 'SF') {
                    candidateStart = Math.max(0, uStart + lag - sampledDuration);
                }
                else {
                    // Default FS (Finish-to-Start)
                    candidateStart = Math.max(0, uStart + uDur * w + lag);
                }
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
        const pert = nodePert[i];
        const sortedStarts = Float64Array.from(nodeStartSamples[i]).sort();
        const sortedEnds = Float64Array.from(nodeEndSamples[i]).sort();
        const nodeP50Start = Number(percentileSorted(sortedStarts, 0.5).toFixed(1));
        const nodeP50End = Number(percentileSorted(sortedEnds, 0.5).toFixed(1));
        const nodeP85End = Number(percentileSorted(sortedEnds, 0.85).toFixed(1));
        const nodeP95End = Number(percentileSorted(sortedEnds, 0.95).toFixed(1));
        const criticalityIndex = Number((criticalHits[i] / iterations).toFixed(3));
        const effWeight = blastInfo.effectiveWeights[node.key] ?? 0;
        const completionStepPct = computeNodeCompletionStepPct(node, outgoingByKey.get(node.key) ?? [], nodeByKey);
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
            totalFloatDays: cpmMetrics[node.key]?.totalFloatDays ?? cpmMetrics[node.key]?.slackDays ?? 0,
            completionStepPct,
            pertMeanDays: pert.meanDays,
            pertSigmaDays: pert.sigmaDays,
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
    // Identify super-critical nodes (negative float relative to target deadline)
    const superCriticalNodes = topoKeys.filter((key) => {
        const stat = nodeStats[key];
        return stat.status.toLowerCase() !== 'done' && (stat.totalFloatDays ?? 0) < 0;
    });
    // Rank top bottlenecks with Mitigation ROI
    const topBottlenecks = orderedNodes
        .filter((node) => node.status.toLowerCase() !== 'done')
        .map((node) => {
        const stat = nodeStats[node.key];
        const cpm = cpmMetrics[node.key];
        const downstreamCount = cpm?.downstreamCount ?? 0;
        const downstreamRippleWeight = cpm?.downstreamRippleWeight ?? 0;
        const slackDays = cpm?.slackDays ?? 0;
        const totalFloatDays = cpm?.totalFloatDays ?? slackDays;
        // Composite causal bottleneck score (0..100)
        const criticalityTerm = stat.criticalityIndex * 45;
        const fanoutTerm = Math.min(30, downstreamRippleWeight * 3.8);
        const uncertaintyTerm = Math.min(15, node.uncertaintySigma * 4.5);
        const zeroSlackBonus = slackDays <= 0.5 ? 10 : Math.max(0, 10 - slackDays * 1.5);
        const riskScore = Math.min(99, Math.round(criticalityTerm + fanoutTerm + uncertaintyTerm + zeroSlackBonus));
        // Mitigation ROI: expected schedule risk reduction per day of mitigation effort
        const brooks = computeBrooksLawMetrics(node);
        const expectedRiskReductionDays = Math.max(0.5, (brooks.netAccelerationDays + node.uncertaintySigma * 0.4) *
            Math.max(0.25, stat.criticalityIndex) *
            (1 + Math.min(2.5, downstreamRippleWeight * 0.25)));
        const mitigationCostDays = Math.max(1.0, node.pureRisks?.[0]?.mitigationEffortDays ?? Math.max(1.0, node.baseEstimateDays * 0.25));
        const mitigationROI = Number((expectedRiskReductionDays / mitigationCostDays).toFixed(2));
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
            totalFloatDays,
            mitigationROI,
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
    // Fast-tracking overlap & late scope-change maturity escalation
    let fastTrackingReworkBonus = 0;
    for (const edge of effectiveEdges) {
        if ((edge.lagDays ?? 0) < 0) {
            fastTrackingReworkBonus += Math.abs(edge.lagDays) * 1.8;
        }
    }
    const maturityRatio = orderedNodes.length > 0 ? (doneCount + inProgressCount * 0.5) / orderedNodes.length : 0;
    const lateChangeEscalationFactor = Number(Math.exp(0.65 * maturityRatio).toFixed(2));
    const estimatedReworkHours = Number(Math.max(4, (blastInfo.blastRadiusKeys.length * 3.5 +
        Math.max(0, interventionDelta) * 5.2 +
        fastTrackingReworkBonus) *
        (interventionDelta > 0 ? lateChangeEscalationFactor * 0.78 : 1.0) *
        (addDeveloper ? 0.65 : 1.0) *
        (decoupleBlockingEdges ? 0.5 : 1.0)).toFixed(1));
    // 1. Three-Tier Schedule Reserve Breakdown (Base P50, PM Contingency P85-P50, Exec Reserve CVaR95-P85)
    const pmContingencyReserveDays = Number(Math.max(0.5, p85Days - p50Days).toFixed(1));
    const managementReserveDays = Number(Math.max(0.5, cvar95Days - p85Days).toFixed(1));
    let totalBac = 0;
    let committedEffort = 0;
    for (const node of orderedNodes) {
        const bac = Math.max(0.5, node.plannedEffortDays ?? node.baseEstimateDays);
        totalBac += bac;
        const sLow = node.status.toLowerCase();
        if (sLow === 'done' || sLow.includes('progress') || sLow.includes('block')) {
            committedEffort += bac;
        }
    }
    const committedEffortRatio = Number((totalBac > 0 ? Math.min(1, committedEffort / totalBac) : 0).toFixed(2));
    const activeSlipOrBlock = Math.max(0, interventionDelta) + blockedCount * 1.5;
    const bufferBurnRatio = Number(Math.min(2.0, activeSlipOrBlock / Math.max(1.0, pmContingencyReserveDays)).toFixed(2));
    const reserves = {
        baseTargetDays: p50Days,
        pmContingencyReserveDays,
        managementReserveDays,
        bufferBurnRatio,
        committedEffortRatio,
    };
    // 2. Hierarchical Engineering Earned Value (EVM in Dev-Days: BAC, BCWS, BCWP, ACWP, CPI, SPI, EAC)
    let totalBcws = 0;
    let totalBcwp = 0;
    let totalAcwp = 0;
    const byTeamAccum = new Map();
    for (const node of orderedNodes) {
        const stat = nodeStats[node.key];
        const bac = Math.max(0.5, node.plannedEffortDays ?? node.baseEstimateDays);
        const stepPct = (stat?.completionStepPct ?? 0) / 100;
        const bcwp = bac * stepPct;
        const sLow = node.status.toLowerCase();
        const plannedPct = sLow === 'done'
            ? 1.0
            : sLow.includes('block')
                ? 0.65
                : sLow.includes('progress')
                    ? 0.55
                    : 0.0;
        const bcws = bac * plannedPct;
        let acwp = typeof node.actualEffortDays === 'number'
            ? node.actualEffortDays
            : sLow === 'done'
                ? bac
                : sLow.includes('block')
                    ? bac * 0.5
                    : sLow.includes('progress')
                        ? bac * 0.52
                        : 0;
        if (node.key === intervenedKey && interventionDelta > 0) {
            acwp += interventionDelta * 0.75;
        }
        totalBcws += bcws;
        totalBcwp += bcwp;
        totalAcwp += acwp;
        const tEntry = byTeamAccum.get(node.team) ?? { bac: 0, bcws: 0, bcwp: 0, acwp: 0 };
        tEntry.bac += bac;
        tEntry.bcws += bcws;
        tEntry.bcwp += bcwp;
        tEntry.acwp += acwp;
        byTeamAccum.set(node.team, tEntry);
    }
    const safeDiv = (num, den) => den > 0.01 ? Number((num / den).toFixed(2)) : 1.0;
    const projectCpi = safeDiv(totalBcwp, totalAcwp);
    const projectSpi = safeDiv(totalBcwp, totalBcws);
    const cvDays = Number((totalBcwp - totalAcwp).toFixed(1));
    const svDays = Number((totalBcwp - totalBcws).toFixed(1));
    const eacOneOffDays = Number(Math.max(0.5, totalAcwp + (totalBac - totalBcwp)).toFixed(1));
    const eacTrendDays = Number(Math.max(0.5, totalBac / Math.max(0.25, projectCpi)).toFixed(1));
    const etcDays = Number(Math.max(0, (totalBac - totalBcwp) / Math.max(0.25, projectSpi)).toFixed(1));
    const byTeam = {};
    let hasUnderperformingTeam = false;
    let hasOutperformingTeam = false;
    for (const [teamName, acc] of byTeamAccum.entries()) {
        const tCpi = safeDiv(acc.bcwp, acc.acwp);
        const tSpi = safeDiv(acc.bcwp, acc.bcws);
        if (tCpi < 0.88 || tSpi < 0.88)
            hasUnderperformingTeam = true;
        if (tCpi >= 1.02 && tSpi >= 0.98)
            hasOutperformingTeam = true;
        byTeam[teamName] = {
            bacDays: Number(acc.bac.toFixed(1)),
            bcwsDays: Number(acc.bcws.toFixed(1)),
            bcwpDays: Number(acc.bcwp.toFixed(1)),
            acwpDays: Number(acc.acwp.toFixed(1)),
            cvDays: Number((acc.bcwp - acc.acwp).toFixed(1)),
            svDays: Number((acc.bcwp - acc.bcws).toFixed(1)),
            cpi: tCpi,
            spi: tSpi,
            maskingWarning: (tCpi < 0.88 || tSpi < 0.88) && (projectCpi >= 0.92 || projectSpi >= 0.92),
        };
    }
    const earnedValue = {
        bacDays: Number(totalBac.toFixed(1)),
        bcwsDays: Number(totalBcws.toFixed(1)),
        bcwpDays: Number(totalBcwp.toFixed(1)),
        acwpDays: Number(totalAcwp.toFixed(1)),
        cvDays,
        svDays,
        cpi: projectCpi,
        spi: projectSpi,
        eacOneOffDays,
        eacTrendDays,
        etcDays,
        maskingWarning: hasUnderperformingTeam &&
            (hasOutperformingTeam || projectCpi >= 0.92 || projectSpi >= 0.92),
        byTeam,
    };
    // 3. Software Delivery Governance, Brooks's Law, Cross-Team Handoffs, Hypercare & Retro Calibration
    const inspectNode = (intervenedKey ? nodeByKey.get(intervenedKey) : undefined) ??
        (topBottlenecks[0] ? nodeByKey.get(topBottlenecks[0].key) : undefined) ??
        orderedNodes[0];
    const brooksLawDiagnostic = inspectNode
        ? computeBrooksLawMetrics(inspectNode)
        : undefined;
    const overallocatedAssignees = [];
    for (const [assignee, issues] of assigneeActiveTasks.entries()) {
        if (issues.length >= 2) {
            overallocatedAssignees.push({
                assignee,
                concurrentIssues: issues,
                utilizationPct: Math.min(250, issues.length * 65),
            });
        }
    }
    let blockedHandoffIdleDays = 0;
    for (const edge of effectiveEdges) {
        const uNode = nodeByKey.get(edge.from);
        const vNode = nodeByKey.get(edge.to);
        if (!uNode || !vNode)
            continue;
        const isCrossTeam = uNode.team !== vNode.team ||
            edge.dependencyType === 'Cross-Team Handoff' ||
            vNode.executionMode === 'cross-team-dependency' ||
            vNode.executionMode === 'external-vendor-api';
        if (isCrossTeam) {
            const uSlip = Math.max(0, nodeStats[uNode.key]?.rippleDelayDays ?? 0);
            blockedHandoffIdleDays += uSlip > 0 ? uSlip * edge.propagationWeight : 0.4;
        }
    }
    blockedHandoffIdleDays = Number(blockedHandoffIdleDays.toFixed(1));
    const stageGateNodes = orderedNodes
        .filter((nd) => nd.isStageGate ||
        nd.issueType?.toLowerCase() === 'milestone' ||
        nd.issueType?.toLowerCase() === 'gate' ||
        Boolean(nd.confluenceDecision))
        .map((nd) => nd.key);
    const hypercareReserveDays = Number(Math.max(1.0, p50Days * 0.05 + estimatedReworkHours / 16).toFixed(1));
    let readyNodes = 0;
    for (const nd of orderedNodes) {
        const hasAssignee = Boolean(nd.assignee && nd.assignee.toLowerCase() !== 'unassigned');
        const hasEst = nd.baseEstimateDays > 0;
        const hasGoal = Boolean(nd.goalId);
        if (hasAssignee && hasEst && hasGoal)
            readyNodes++;
    }
    const sprintReadinessScore = orderedNodes.length > 0 ? Math.round((readyNodes / orderedNodes.length) * 100) : 100;
    const completedNodes = orderedNodes.filter((nd) => nd.status.toLowerCase() === 'done');
    const empiricalVelocityRatio = completedNodes.length > 0 ? Number((1 / Math.max(0.5, projectCpi)).toFixed(2)) : 1.0;
    const recommendedSigmaMultiplier = Number(Math.max(0.85, Math.min(1.45, empiricalVelocityRatio * (blockedCount > 0 ? 1.12 : 1.0))).toFixed(2));
    const primaryGoalProb = goalImpacts[0]?.probabilityOfOnTime ?? 0.85;
    const slaBreachProbability = Number(Math.max(0, 1 - primaryGoalProb).toFixed(2));
    const costOfDelayDevDays = Number((Math.max(0, p85Days - (goalImpacts[0]?.targetDayOffset ?? p85Days)) * 1.5 +
        blockedHandoffIdleDays).toFixed(1));
    const deliveryGovernance = {
        releaseMode: 'external-commit',
        slaBreachProbability,
        costOfDelayDevDays,
        brooksLawDiagnostic: brooksLawDiagnostic
            ? {
                communicationChannelsBefore: brooksLawDiagnostic.communicationChannelsBefore,
                communicationChannelsAfter: brooksLawDiagnostic.communicationChannelsAfter,
                onboardingPenaltyDays: brooksLawDiagnostic.onboardingPenaltyDays,
                netAccelerationDays: brooksLawDiagnostic.netAccelerationDays,
                warning: brooksLawDiagnostic.warning,
            }
            : undefined,
        overallocatedAssignees,
        blockedHandoffIdleDays,
        lateChangeEscalationFactor,
        stageGateNodes,
        hypercareReserveDays,
        sprintReadinessScore,
        lessonsLearntCalibration: {
            completedCount: completedNodes.length,
            empiricalVelocityRatio,
            recommendedSigmaMultiplier,
            summary: completedNodes.length > 0
                ? `Calibrated across ${completedNodes.length} completed tasks (velocity ratio ${empiricalVelocityRatio}x, recommended σ multiplier ${recommendedSigmaMultiplier}x).`
                : `Baseline prior active (0 completed tasks yet; complete sprint issues to auto-calibrate empirical σ).`,
        },
    };
    const executionTimeMs = Number((performance.now() - startClock).toFixed(2));
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
        superCriticalNodes,
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
        reserves,
        earnedValue,
        deliveryGovernance,
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


// === Module: ui/components/tooltip ===
/**
 * Reusable Tooltip, Date, Lozenge & Avatar Utilities (`static/ui/src/components/tooltip.ts`)
 *
 * Implements Atlassian Design System (ADS) helpers:
 * 1. `renderInfoTooltip(title, explanation, mathFormula)`: Renders a clean ADS `?` badge that reveals
 *    technical math/formulas on hover without cluttering the primary Jira view.
 * 2. `formatFriendlyDate(isoDate)`: Converts `2026-12-14` -> `Dec 14, 2026`.
 * 3. `renderJiraStatusLozenge(status)`: Renders an authentic rectangular Jira lozenge (`TO DO`, `IN PROGRESS`, `DONE`, `AT RISK`).
 * 4. `getInitials(name)`: Extracts 2-letter avatar initials (e.g. `PP`, `MC`).
 */
function escapeHtmlText(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function formatFriendlyDate(isoDate, includeYear = false) {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate))
        return String(isoDate ?? 'N/A');
    const [y, m, d] = isoDate.split('-').map(Number);
    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];
    const monthName = months[(m - 1) % 12] ?? 'Nov';
    return includeYear ? `${monthName} ${d}, ${y}` : `${monthName} ${d}`;
}
function getInitials(name) {
    if (!name || name.toLowerCase() === 'unassigned')
        return 'UA';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1)
        return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
function renderJiraStatusLozenge(status) {
    const safeStatus = String(status || 'To Do');
    const lower = safeStatus.toLowerCase();
    if (lower === 'done' || lower === 'completed') {
        return `<span class="jira-lozenge jira-lozenge-done">DONE</span>`;
    }
    if (lower.includes('risk') || lower.includes('block') || lower === 'off track') {
        return `<span class="jira-lozenge jira-lozenge-danger">${escapeHtmlText(safeStatus.toUpperCase())}</span>`;
    }
    if (lower.includes('progress')) {
        return `<span class="jira-lozenge jira-lozenge-inprogress">IN PROGRESS</span>`;
    }
    return `<span class="jira-lozenge jira-lozenge-todo">TO DO</span>`;
}
function renderInfoTooltip(title, explanation, mathFormula) {
    return `
    <span class="info-tooltip-wrap" tabindex="0">
      <span class="info-badge" aria-label="More info">?</span>
      <span class="info-popover">
        <strong class="info-popover-title">${escapeHtmlText(title)}</strong>
        <span class="info-popover-body">${escapeHtmlText(explanation)}</span>
        ${mathFormula
        ? `<code class="info-popover-math">📐 ${escapeHtmlText(mathFormula)}</code>`
        : ''}
      </span>
    </span>
  `;
}


// === Module: ui/components/HeaderBar ===
/**
 * Step 4 Component 1: Atlassian Jira-Native Header Bar & 4-Card Summary Strip (`static/ui/src/components/HeaderBar.tsx`)
 *
 * Designed via Stitch MCP & Atlassian Design System (ADS):
 * - Native Jira Breadcrumb (`Spaces / [Project Switcher Dropdown] / Rovo-World-Model`)
 * - Switches dynamically across the user's real Jira projects (e.g., BloomPath Sprint, Triton)
 * - Clean Atlassian action buttons: `Sync Live Jira`, `Focus #1 Blocker`, `Seed Sample Tasks`, `Reset`
 * - 4 Atlassian Executive Summary Cards with rectangular ADS lozenges (`ON TRACK`, `AT RISK`, `BLOCKER`)
 *   and progressive-disclosure `?` tooltips for all underlying math.
 */
function renderHeaderBar(props) {
    const { availableProjects, graph, baselineSim, activeSim, intervention, selectedNodeKey, delayDays, addDeveloper, decoupleBlockingEdges, statusBanner, } = props;
    const p85Shift = intervention ? intervention.p85ShiftDays : 0;
    const p95Shift = intervention ? intervention.p95ShiftDays : 0;
    const hasActiveIntervention = delayDays !== 0 || addDeveloper || decoupleBlockingEdges;
    const affectedGoalsCount = activeSim.goalImpacts.filter((g) => g.status !== 'On Track' || Math.abs(g.rippleDelayDays) > 0).length;
    const topBlocker = activeSim.topBottlenecks[0];
    const topBlockerKey = topBlocker?.key ?? graph.nodes[0]?.key ?? 'BLP-7';
    const windowBufferDays = Math.max(1, Math.round(activeSim.p95Days - activeSim.p50Days));
    const superCriticalCount = activeSim.superCriticalNodes?.length ?? 0;
    const reserves = activeSim.reserves;
    const pmBufferDays = reserves ? Math.round(reserves.pmContingencyReserveDays) : Math.max(1, Math.round(activeSim.p85Days - activeSim.p50Days));
    const execReserveDays = reserves ? Math.round(reserves.managementReserveDays) : Math.max(1, Math.round(activeSim.cvar95Days - activeSim.p85Days));
    const bufferBurnPct = reserves ? Math.round(reserves.bufferBurnRatio * 100) : 0;
    const overallocatedList = activeSim.deliveryGovernance?.overallocatedAssignees ?? [];
    const evm = activeSim.earnedValue;
    const projectList = availableProjects.length > 0
        ? [...availableProjects]
        : [
            {
                id: graph.projectKey,
                key: graph.projectKey,
                name: graph.projectName,
            },
        ];
    const hasCurrentInList = projectList.some((p) => p.key === graph.projectKey);
    if (!hasCurrentInList) {
        projectList.unshift({
            id: graph.projectKey,
            key: graph.projectKey,
            name: graph.projectName,
        });
    }
    const releaseLozenge = p85Shift > 0
        ? `<span class="jira-lozenge jira-lozenge-danger">+${p85Shift}D SLIP</span>`
        : p85Shift < 0
            ? `<span class="jira-lozenge jira-lozenge-done">${p85Shift}D FASTER</span>`
            : `<span class="jira-lozenge jira-lozenge-done">ON TRACK</span>`;
    return `
    <header class="cockpit-header">
      <div class="brand-cluster">
        <div class="jira-project-avatar" title="${escapeHtmlText(graph.projectName)} (${escapeHtmlText(graph.projectKey)})">
          ${escapeHtmlText(graph.projectKey.slice(0, 3))}
        </div>
        <div class="brand-titles">
          <div class="jira-breadcrumbs">
            <span>Spaces</span>
            <span class="crumb-sep">/</span>
            <select id="jira-project-select" class="jira-project-select" title="Switch active Jira project">
              ${projectList
        .map((p) => `
                  <option value="${escapeHtmlText(p.key)}" ${p.key === graph.projectKey ? 'selected' : ''}>
                    ${escapeHtmlText(p.name)} (${escapeHtmlText(p.key)})
                  </option>
                `)
        .join('')}
            </select>
            <span class="crumb-sep">/</span>
            <span class="crumb-current">Rovo-World-Model</span>
          </div>
          <div class="brand-heading-row">
            <h1>${escapeHtmlText(graph.projectName)}</h1>
            <span class="jira-lozenge jira-lozenge-todo">
              ${graph.nodes.length} ${graph.nodes.length === 1 ? 'ISSUE' : 'ISSUES'}
            </span>
            <span class="jira-lozenge jira-lozenge-goal">TEAMWORK GRAPH</span>
            ${renderInfoTooltip('Rovo-World-Model Digital Twin', 'Automatically loads issues and dependencies from your selected Jira project and runs 500 Monte Carlo simulations to forecast delivery dates and goal risks.', `Active Project: ${graph.projectKey} (${graph.nodes.length} nodes, ${graph.edges.length} links) | Latency: ${activeSim.executionTimeMs} ms`)}
          </div>
        </div>
      </div>

      <div class="header-actions">
        <button class="btn btn-primary" id="btn-sync-jira" title="Refresh live issues and dependency links from Jira">
          ↻ Sync Jira Project
        </button>
        <button class="btn" id="btn-jump-bottleneck" title="Select the #1 critical path blocker issue">
          🎯 Focus Blocker (${escapeHtmlText(topBlockerKey)})
        </button>
        <button class="btn" id="btn-create-jira-issues" title="Populate linked sample issues into this Jira project via REST API">
          ➕ Add Sample Issues
        </button>
        <button class="btn ${hasActiveIntervention ? 'btn-danger-outline' : ''}" id="btn-reset-sim" title="Reset What-If simulation back to baseline">
          Reset
        </button>
      </div>
    </header>

    ${statusBanner
        ? `<div class="status-banner-bar">
             <div class="status-banner-left">
               <span class="status-dot"></span>
               <span>${escapeHtmlText(statusBanner)}</span>
             </div>
             <span class="status-latency-pill" title="500 Monte Carlo futures computed in ${activeSim.executionTimeMs} ms">
               500 simulations · ${activeSim.executionTimeMs} ms
             </span>
           </div>`
        : ''}

    <!-- 4-CARD ATLASSIAN EXECUTIVE SUMMARY STRIP -->
    <section class="kpi-strip">
      <!-- Card 1: Projected Release Date -->
      <div class="kpi-card ${p85Shift > 0 ? 'highlight-shift' : p85Shift < 0 ? 'highlight-accel' : ''}">
        <div class="kpi-label">
          <span>PROJECTED RELEASE DATE</span>
          ${renderInfoTooltip('85% Confidence Commit Date (P85)', 'Statistically, 85 out of 100 simulated project runs finish on or before this date. Compare with the baseline target to see the impact of your What-If change.', `P85 = ${activeSim.p85Date} (+${activeSim.p85Days}d) | Baseline P85 = ${baselineSim.p85Date} | Super-Critical (Float < 0): ${superCriticalCount} issues`)}
        </div>
        <div class="kpi-value">
          <span>${formatFriendlyDate(activeSim.p85Date, true)}</span>
          ${releaseLozenge}
        </div>
        <div class="kpi-sub">
          Baseline Target: <strong>${formatFriendlyDate(baselineSim.p85Date, true)}</strong>${superCriticalCount > 0
        ? ` · <strong style="color:#AE2E24;">${superCriticalCount} Negative Float</strong>`
        : ' (85% confidence)'}
        </div>
      </div>

      <!-- Card 2: Delivery Forecast Window -->
      <div class="kpi-card">
        <div class="kpi-label">
          <span>DELIVERY FORECAST WINDOW</span>
          ${renderInfoTooltip('3-Tier Schedule Buffers & Tail Risk (P50 / P85 / CVaR)', 'Decomposes schedule uncertainty into Base Target (P50), PM Contingency Buffer (P85 - P50), and Executive Tail Reserve (CVaR95 - P85).', `Base P50=${activeSim.p50Date} | PM Buffer=+${pmBufferDays}d | Exec Reserve=+${execReserveDays}d | Buffer Burn=${bufferBurnPct}%`)}
        </div>
        <div class="kpi-value">
          <span>${formatFriendlyDate(activeSim.p50Date)} – ${formatFriendlyDate(activeSim.p95Date)}</span>
          <span class="jira-lozenge jira-lozenge-todo">±${windowBufferDays}D SPREAD</span>
        </div>
        <div class="kpi-sub">
          Target: <strong>${formatFriendlyDate(activeSim.p50Date)}</strong> · PM Buffer: <strong>+${pmBufferDays}d</strong> · Exec: <strong>+${execReserveDays}d</strong>
        </div>
      </div>

      <!-- Card 3: Critical Blockers -->
      <div class="kpi-card">
        <div class="kpi-label">
          <span>CRITICAL PATH BLOCKERS</span>
          ${renderInfoTooltip('Topological Critical Path & Resource Contention', 'Issues with zero or negative schedule slack that gate project completion, plus parallel assignee multi-tasking contention.', `Critical Path (${activeSim.criticalPathNodes.length} issues) | Top Blocker ${topBlockerKey} ROI = ${topBlocker?.mitigationROI ?? 1.0}d/$ | Overloaded Assignees = ${overallocatedList.length}`)}
        </div>
        <div class="kpi-value">
          <span>${activeSim.criticalPathNodes.length} ${activeSim.criticalPathNodes.length === 1 ? 'Blocker' : 'Blockers'}</span>
          <span class="jira-lozenge jira-lozenge-inprogress">TOP: ${escapeHtmlText(topBlockerKey)}</span>
        </div>
        <div class="kpi-sub">
          <strong>${escapeHtmlText(topBlockerKey)}</strong> gates <strong>${topBlocker?.downstreamCount ?? 1} ${(topBlocker?.downstreamCount ?? 1) === 1 ? 'issue' : 'issues'}</strong>${overallocatedList.length > 0
        ? ` · <strong style="color:#A54800;">${overallocatedList.length} Overloaded Dev</strong>`
        : ''}
        </div>
      </div>

      <!-- Card 4: Teamwork Graph Goals -->
      <div class="kpi-card ${(affectedGoalsCount > 0 && p85Shift > 0) || evm?.maskingWarning ? 'highlight-shift' : ''}">
        <div class="kpi-label">
          <span>TEAMWORK GRAPH GOALS</span>
          ${renderInfoTooltip('Teamwork Graph Goals & Engineering Earned Value', 'Connects project issues to Teamwork Graph Goals and tracks Dev-Day Earned Value (CPI = BCWP/ACWP, SPI = BCWP/BCWS) across engineering squads.', `Effort CPI = ${evm?.cpi ?? 1.0} | Schedule SPI = ${evm?.spi ?? 1.0} | EAC = ${evm?.eacTrendDays ?? 0}d (BAC ${evm?.bacDays ?? 0}d) | Friction E = ${activeSim.quasimetricEnergy}`)}
        </div>
        <div class="kpi-value">
          <span>${hasActiveIntervention
        ? `${activeSim.blastRadiusNodes.length} Impacted`
        : `${activeSim.goalImpacts.length} Goals Linked`}</span>
          <span class="jira-lozenge ${affectedGoalsCount > 0 && p85Shift > 0 ? 'jira-lozenge-danger' : 'jira-lozenge-done'}">
            ${affectedGoalsCount > 0 && p85Shift > 0 ? 'AT RISK' : 'HEALTHY'}
          </span>
        </div>
        <div class="kpi-sub">
          Effort CPI <strong>${(evm?.cpi ?? 1.0).toFixed(2)}</strong> · Schedule SPI <strong>${(evm?.spi ?? 1.0).toFixed(2)}</strong> · ${activeSim.goalImpacts
        .map((g) => `${escapeHtmlText(g.goalName)} (${g.status})`)
        .join(' · ')}
        </div>
      </div>
    </section>
  `;
}


// === Module: ui/components/TimelineScrubber ===
/**
 * Step 4 Component 3: Atlassian Jira-Native Timeline Scrubber (`static/ui/src/components/TimelineScrubber.tsx`)
 *
 * Clean Jira Plans / Timeline bar with rectangular ADS status lozenges (`DONE`, `IN PROGRESS`, `AT RISK`, `TO DO`)
 * and human-friendly milestone buttons.
 */
function evaluateNodeTemporalState(node, stat, scrubberDayOffset, hasActiveIntervention) {
    const statusLower = node.status.toLowerCase();
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
    if (statusLower === 'done')
        return 'Done';
    const p50Start = stat?.p50StartDay ?? 0;
    const p85End = stat?.p85EndDay ?? node.baseEstimateDays;
    const p50End = stat?.p50EndDay ?? node.baseEstimateDays;
    if (scrubberDayOffset >= p85End) {
        return 'Done';
    }
    if (scrubberDayOffset >= p50End && scrubberDayOffset < p85End) {
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
const HUMAN_EPOCH_LABELS = {
    0: { title: 'Sprint -2', badge: '4W AGO' },
    1: { title: 'Sprint -1', badge: '2W AGO' },
    2: { title: 'Today (Current)', badge: 'LIVE' },
    3: { title: 'Likely Finish', badge: '50% TARGET' },
    4: { title: 'Commit Target', badge: '85% COMMIT' },
    5: { title: 'Buffer Cutoff', badge: '95% SAFE' },
};
function renderTimelineScrubber(props) {
    const { graph, activeSim, selectedEpochIndex, scrubberDayOffset, hasActiveIntervention, } = props;
    const epochs = activeSim.timeMachineEpochs;
    const scrubbedDate = addCalendarDays(graph.referenceDate, scrubberDayOffset);
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
    const relativeOffsetLabel = scrubberDayOffset === 0
        ? 'Today'
        : scrubberDayOffset > 0
            ? `+${scrubberDayOffset} Days`
            : `${scrubberDayOffset} Days`;
    const maxBucketProb = Math.max(0.05, ...activeSim.distributionBuckets.map((b) => b.probability));
    const reserves = activeSim.reserves;
    const baseTargetDays = reserves?.baseTargetDays ?? activeSim.p50Days;
    const pmBufferDays = reserves?.pmContingencyReserveDays ?? Math.max(0.5, activeSim.p85Days - activeSim.p50Days);
    const execReserveDays = reserves?.managementReserveDays ?? Math.max(0.5, activeSim.cvar95Days - activeSim.p85Days);
    const totalReserveSpan = Math.max(1, baseTargetDays + pmBufferDays + execReserveDays);
    const basePct = Math.max(20, Math.round((baseTargetDays / totalReserveSpan) * 100));
    const pmPct = Math.max(10, Math.round((pmBufferDays / totalReserveSpan) * 100));
    const execPct = Math.max(8, 100 - basePct - pmPct);
    return `
    <section class="time-machine-panel">
      <div class="tm-header">
        <div class="tm-title">
          <span>Timeline &amp; Sprint Forecast Scrubber</span>
          ${renderInfoTooltip('Timeline Scrubber', 'Select a sprint milestone or drag the timeline slider to preview which issues are expected to be Done, In Progress, or At Risk on any future date.', `Reference Date = ${graph.referenceDate} | Selected Offset = ${scrubberDayOffset}d (${scrubbedDate})`)}
        </div>
        <div class="tm-date-readout">
          <span class="tm-date-pill">
            Viewing Date: <strong>${formatFriendlyDate(scrubbedDate, true)}</strong>
            <span class="jira-lozenge jira-lozenge-todo">${relativeOffsetLabel}</span>
          </span>
        </div>
      </div>

      <div class="epoch-track">
        ${epochs
        .map((ep, idx) => {
        const meta = HUMAN_EPOCH_LABELS[idx] ?? {
            title: ep.label,
            badge: `${ep.dayOffset >= 0 ? `+${ep.dayOffset}d` : `${ep.dayOffset}d`}`,
        };
        const lozClass = idx === 2
            ? 'jira-lozenge-done'
            : idx >= 3
                ? 'jira-lozenge-todo'
                : 'jira-lozenge-neutral';
        return `
              <button
                class="epoch-node ${idx === selectedEpochIndex ? 'active' : ''}"
                data-epoch-idx="${idx}"
                title="${escapeHtmlText(ep.narrative)}"
              >
                <div class="epoch-node-top">
                  <span class="jira-lozenge ${lozClass}">${escapeHtmlText(meta.badge)}</span>
                  <span class="epoch-date-str">${formatFriendlyDate(ep.date)}</span>
                </div>
                <div class="epoch-node-label">${escapeHtmlText(meta.title)}</div>
              </button>
            `;
    })
        .join('')}
      </div>

      <div class="tm-scrubber-row">
        <div class="tm-narrative-box">
          <div class="tm-slider-wrap">
            <span class="tm-slider-bound">Past (-28d)</span>
            <input
              type="range"
              min="-28"
              max="${Math.max(35, Math.ceil(activeSim.p95Days) + 6)}"
              value="${scrubberDayOffset}"
              class="tm-slider"
              id="time-machine-range"
              title="Drag to scrub across past sprints and future completion dates"
            />
            <span class="tm-slider-bound">Buffer (${formatFriendlyDate(activeSim.p95Date)})</span>
          </div>

          <div class="reserve-segmented-wrap" title="3-Tier Schedule Buffer Allocation: Base Target (P50 = ${baseTargetDays.toFixed(1)}d) + PM Contingency Buffer (+${pmBufferDays.toFixed(1)}d) + Executive Tail Reserve (+${execReserveDays.toFixed(1)}d)">
            <div class="reserve-segmented-bar">
              <div class="reserve-seg reserve-seg-base" style="width:${basePct}%;" title="Base Target (P50): ${baseTargetDays.toFixed(1)} days"></div>
              <div class="reserve-seg reserve-seg-pm" style="width:${pmPct}%;" title="PM Contingency Buffer (P85 - P50): +${pmBufferDays.toFixed(1)} days"></div>
              <div class="reserve-seg reserve-seg-exec" style="width:${execPct}%;" title="Executive Tail Reserve (CVaR95 - P85): +${execReserveDays.toFixed(1)} days"></div>
            </div>
            <div class="reserve-segmented-legend">
              <span><i class="reserve-dot" style="background:#0C66E4;"></i>Base P50 (${Math.round(baseTargetDays)}d)</span>
              <span><i class="reserve-dot" style="background:#E2B203;"></i>PM Buffer (+${Math.round(pmBufferDays)}d)</span>
              <span><i class="reserve-dot" style="background:#6E5DC6;"></i>Exec Reserve (+${Math.round(execReserveDays)}d)</span>
            </div>
          </div>

          <div class="tm-status-summary">
            <span class="tm-status-prefix">Status on <strong>${formatFriendlyDate(scrubbedDate)}</strong>:</span>
            <span class="jira-lozenge jira-lozenge-done">${dynamicDone} DONE</span>
            <span class="jira-lozenge jira-lozenge-inprogress">${dynamicInProgress} IN PROGRESS</span>
            <span class="jira-lozenge ${dynamicAtRisk > 0 ? 'jira-lozenge-danger' : 'jira-lozenge-neutral'}">${dynamicAtRisk} AT RISK</span>
            <span class="jira-lozenge jira-lozenge-todo">${dynamicScheduled} TO DO</span>
          </div>
        </div>

        <div class="cone-box-wrap" title="Hover bars for exact Monte Carlo completion probability and cumulative confidence">
          <div class="cone-box-header">
            <span>Delivery Confidence Distribution</span>
            <strong style="color:#0C66E4;">Target: ${formatFriendlyDate(activeSim.p85Date)}</strong>
          </div>
          <div class="cone-mini-chart">
            ${activeSim.distributionBuckets
        .map((b, idx, arr) => {
        const heightPct = Math.max(10, Math.round((b.probability / maxBucketProb) * 100));
        const isNearP85 = Math.abs(b.dayOffset - activeSim.p85Days) <= 2.5;
        const isNearScrub = Math.abs(b.dayOffset - scrubberDayOffset) <= 2;
        const showDateLabel = idx === 0 || idx === Math.floor(arr.length / 2) || idx === arr.length - 1;
        return `
                  <div
                    class="cone-bar-col"
                    title="${formatFriendlyDate(b.date, true)}: ${Math.round(b.probability * 100)}% density | Confidence: ${Math.round(b.cumulativeProbability * 100)}%"
                  >
                    <div class="cone-bar ${isNearP85 ? 'p85-marker' : ''} ${isNearScrub ? 'scrub-marker' : ''}" style="height:${heightPct}%;"></div>
                    <span class="cone-bar-label">${showDateLabel ? formatFriendlyDate(b.date) : '&nbsp;'}</span>
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
 * Step 4 Component 2: Atlassian Jira-Native Dependency & Timeline Canvas (`static/ui/src/components/DagCanvas.tsx`)
 *
 * Designed via Stitch MCP (`StitchMCP` Project `9764708271730429878`) to match Jira Cloud cards:
 * - Authentic white Jira Issue Cards (`#FFFFFF`, `1px solid #DCDFE4`)
 * - Standard Jira blue checkbox icon (`#0C66E4`) + Issue Key (`BLP-7`) + Rectangular Status Lozenge (`TO DO`, `IN PROGRESS`, `DONE`, `AT RISK`)
 * - Assignee avatar circle (`PP`, `MC`) + clean estimate tag (`5d est.`)
 * - Scales cleanly whether the active Jira project has 2 issues (e.g. BloomPath Sprint `BLP-7`, `BLP-8`) or 18 issues.
 * - Hovering any issue card reveals the floating Jira Inspector Popover with full metadata & math.
 */
function computeNodeCoordinates(graph) {
    const coords = {};
    // Only render swimlanes that actually contain issues in this project
    const usedTeamNames = Array.from(new Set(graph.nodes.map((n) => n.team)));
    const activeTeams = usedTeamNames.map((tName, idx) => {
        const found = graph.teams.find((t) => t.name === tName);
        const defaultColors = ['#0C66E4', '#1F845A', '#E2B203', '#6E5DC6'];
        return (found ?? {
            id: `team-${idx}`,
            name: tName,
            lead: 'Project Team',
            color: defaultColors[idx % defaultColors.length],
        });
    });
    if (activeTeams.length === 0) {
        activeTeams.push({
            id: 'team-0',
            name: `${graph.projectName} Team`,
            lead: 'Project Lead',
            color: '#0C66E4',
        });
    }
    const laneGroups = new Map();
    for (let l = 0; l < activeTeams.length; l++) {
        laneGroups.set(l, []);
    }
    for (const key of graph.topologicalOrder) {
        const node = graph.nodes.find((n) => n.key === key);
        if (!node)
            continue;
        let laneIdx = activeTeams.findIndex((t) => t.name === node.team);
        if (laneIdx < 0)
            laneIdx = 0;
        laneGroups.get(laneIdx).push(key);
    }
    const laneHeight = 190;
    const xStart = 128;
    const xGap = 224;
    let maxCols = 1;
    for (const [laneIdx, keys] of laneGroups.entries()) {
        if (keys.length > maxCols)
            maxCols = keys.length;
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
function renderDagCanvas(props) {
    const { graph, activeSim, selectedNodeKey, delayDays, addDeveloper, decoupleBlockingEdges, scrubberDayOffset, } = props;
    const { coords, activeTeams, svgHeight, svgWidth } = computeNodeCoordinates(graph);
    const blastSet = new Set(activeSim.blastRadiusNodes);
    const criticalSet = new Set(activeSim.criticalPathNodes);
    const hasActiveIntervention = delayDays !== 0 || addDeveloper || decoupleBlockingEdges;
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
        if (!fromPos || !toPos)
            return '';
        const x1 = fromPos.x + nodeW / 2;
        const y1 = fromPos.y;
        const x2 = toPos.x - nodeW / 2;
        const y2 = toPos.y;
        const dx = Math.max(48, Math.abs(x2 - x1) * 0.45);
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
        const precType = edge.precedenceType ?? 'FS';
        const lagDays = edge.lagDays ?? 0;
        const lagSuffix = lagDays > 0
            ? ` (+${lagDays}d Lag)`
            : lagDays < 0
                ? ` (${lagDays}d Fast-Track)`
                : '';
        const edgeTooltip = `${edge.from} ${edge.dependencyType} (${precType}${lagSuffix}) ${edge.to}`;
        const hasNonDefaultMeta = precType !== 'FS' || lagDays !== 0;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const pillLabel = lagDays < 0
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
        // Jira Status Lozenge colors inside SVG card
        let lozengeBg = '#E9F2FF';
        let lozengeTextCol = '#0055CC';
        let lozengeLabel = 'TO DO';
        if (temporalState === 'Done') {
            lozengeBg = '#DFFCF0';
            lozengeTextCol = '#216E4E';
            lozengeLabel = 'DONE';
        }
        else if (temporalState === 'At Risk / Blocked') {
            lozengeBg = '#FFECEB';
            lozengeTextCol = '#AE2E24';
            lozengeLabel = 'AT RISK';
        }
        else if (temporalState === 'In Progress') {
            lozengeBg = '#FFF7D6';
            lozengeTextCol = '#A54800';
            lozengeLabel = 'IN PROGRESS';
        }
        const rippleShift = stat?.rippleDelayDays ?? 0;
        const goalObj = graph.goals.find((g) => g.id === node.goalId);
        // Top-right shift pill if affected by What-If simulation
        let topBadge = '';
        if (isSelected && hasActiveIntervention) {
            const labelText = delayDays > 0
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
        }
        else if (isInBlast && Math.abs(rippleShift) > 0) {
            const signText = rippleShift > 0 ? `+${rippleShift.toFixed(1)}d Slip` : `${rippleShift.toFixed(1)}d`;
            const fillCol = rippleShift > 0 ? '#CA3521' : '#1F845A';
            topBadge = `
          <g transform="translate(${xLeft + nodeW - 64}, ${yTop - 10})">
            <rect width="64" height="18" rx="3" fill="${fillCol}" />
            <text x="32" y="12.5" text-anchor="middle" fill="#FFFFFF" font-size="9.5" font-weight="700">
              ${signText}
            </text>
          </g>
        `;
        }
        else if (node.isStageGate) {
            topBadge = `
          <g transform="translate(${xLeft + nodeW - 48}, ${yTop - 10})">
            <rect width="48" height="18" rx="3" fill="#6E5DC6" />
            <text x="24" y="12.5" text-anchor="middle" fill="#FFFFFF" font-size="9" font-weight="700">
              GATE
            </text>
          </g>
        `;
        }
        const shortSummary = node.summary.length > 27 ? `${node.summary.slice(0, 26)}…` : node.summary;
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
          ${renderInfoTooltip('Interactive Issue Dependency Map', 'Displays the live issues and dependency links from your selected Jira project. Click any issue card to test a What-If schedule change, or hover over any card for statistical diagnostics.', `Topological Order: ${graph.topologicalOrder.join(' -> ')}`)}
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


// === Module: ui/components/ScenarioPanel ===
/**
 * Step 4 Component 4: Atlassian Jira-Native What-If Simulator Panel (`static/ui/src/components/ScenarioPanel.tsx`)
 *
 * Designed via Stitch MCP (`StitchMCP`) & Atlassian Design System (ADS):
 * - Looks and behaves like a native Jira Cloud Issue Detail & Rovo Insights drawer.
 * - Rectangular ADS status lozenges (`TO DO`, `IN PROGRESS`, `DONE`, `AT RISK`).
 * - Step 1: Schedule Change Slider (`-5d` to `+30d`) + Mitigation Toggles (`Add Developer`, `Decouple Dependency`).
 * - Step 2: Release Date Comparison Bars + Solid Atlassian Blue (`#0C66E4`) `Ask @Rovo-World-Model Agent` button.
 * - Step 3: Teamwork Graph Goals & Inspector Tabs (`Impacted Issues`, `Top Blockers`, `Math & MCP Spec`).
 */
function buildRovoMitigationPrompt(props) {
    const { graph, selectedNodeKey, delayDays, addDeveloper, decoupleBlockingEdges, activeSim } = props;
    const node = graph.nodes.find((n) => n.key === selectedNodeKey) ?? graph.nodes[0];
    const goal = graph.goals.find((g) => g.id === node.goalId) ?? graph.goals[0];
    const shiftStr = delayDays >= 0
        ? `delayed by ${delayDays} days`
        : `accelerated by ${Math.abs(delayDays)} days`;
    const modifiers = [];
    if (addDeveloper)
        modifiers.push('adding +1 developer');
    if (decoupleBlockingEdges)
        modifiers.push('decoupling outgoing blocking dependencies');
    const modSuffix = modifiers.length > 0 ? ` while ${modifiers.join(' and ')}` : '';
    return `@Rovo-World-Model Agent In project "${graph.projectName}" (${graph.projectKey}), simulate what happens to our "${goal?.name ?? 'Sprint Delivery'}" goal if issue ${node.key} ("${node.summary}") is ${shiftStr}${modSuffix}. Projected release date is ${activeSim.p85Date} with ${activeSim.blastRadiusNodes.length} impacted downstream issues. Recommend a concrete mitigation plan.`;
}
function renderTabBody(props) {
    const { activeRightTab, activeSim, intervention, graph, selectedNodeKey, delayDays, addDeveloper, decoupleBlockingEdges, } = props;
    const hasActiveIntervention = delayDays !== 0 || addDeveloper || decoupleBlockingEdges;
    if (activeRightTab === 'cascade') {
        const deltas = intervention?.nodeDeltas.filter((d) => d.key !== selectedNodeKey && Math.abs(d.shiftDays) > 0) ?? [];
        if (!hasActiveIntervention || deltas.length === 0) {
            return `
        <div class="empty-tab-notice">
          Adjust the <strong>Schedule Change Slider</strong> above or toggle a mitigation to preview downstream issue shifts in <strong>${escapeHtmlText(graph.projectName)}</strong>.
        </div>
      `;
        }
        const rows = deltas
            .map((d) => {
            const signStr = d.shiftDays > 0 ? `+${d.shiftDays}d` : `${d.shiftDays}d`;
            const lozClass = d.shiftDays > 0 ? 'jira-lozenge-danger' : 'jira-lozenge-done';
            return `
          <tr data-select-node="${escapeHtmlText(d.key)}" style="cursor:pointer;" title="Click to inspect ${escapeHtmlText(d.key)} (${escapeHtmlText(d.summary)})">
            <td><strong class="jira-issue-key">${escapeHtmlText(d.key)}</strong></td>
            <td>${escapeHtmlText(d.summary.slice(0, 30))}${d.summary.length > 30 ? '…' : ''}</td>
            <td>${formatFriendlyDate(d.intervenedP85Date)}</td>
            <td><span class="jira-lozenge ${lozClass}">${signStr}</span></td>
          </tr>
        `;
        })
            .join('');
        return `
      <table class="cascade-table">
        <thead>
          <tr>
            <th>Issue</th>
            <th>Summary</th>
            <th>New Finish</th>
            <th>Shift</th>
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
        <div class="bottleneck-item" data-select-node="${escapeHtmlText(b.key)}" title="Click to select ${escapeHtmlText(b.key)} | Ripple Weight: ${b.downstreamRippleWeight}">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span>
              <strong style="color:#0C66E4;">#${idx + 1} ${escapeHtmlText(b.key)}</strong>
              — <strong style="font-size:12px;">${escapeHtmlText(b.summary)}</strong>
            </span>
            <span class="jira-lozenge jira-lozenge-inprogress">GATES ${b.downstreamCount}</span>
          </div>
          <div style="font-size:11.5px;color:var(--text-secondary);margin-top:4px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;">
            <span>Assignee: <strong>${escapeHtmlText(b.assignee)}</strong> · Risk Score: <strong>${b.riskScore}/100</strong></span>
            <span>Float: <strong>${(b.totalFloatDays ?? 0).toFixed(1)}d</strong> · ROI: <strong style="color:#216E4E;">${(b.mitigationROI ?? 1.0).toFixed(2)}d/$</strong></span>
          </div>
          <div style="font-size:11.5px;color:#0055CC;margin-top:4px;">
            💡 ${escapeHtmlText(b.recommendation)}
          </div>
        </div>
      `)
            .join('');
    }
    if (activeRightTab === 'governance') {
        const res = activeSim.reserves;
        const evm = activeSim.earnedValue;
        const gov = activeSim.deliveryGovernance;
        const burnPct = res ? Math.round(res.bufferBurnRatio * 100) : 0;
        const burnLozenge = burnPct >= 80
            ? `<span class="jira-lozenge jira-lozenge-danger">${burnPct}% BURN</span>`
            : burnPct >= 50
                ? `<span class="jira-lozenge jira-lozenge-inprogress">${burnPct}% BURN</span>`
                : `<span class="jira-lozenge jira-lozenge-done">${burnPct}% BURN</span>`;
        const cpiVal = evm?.cpi ?? 1.0;
        const spiVal = evm?.spi ?? 1.0;
        const evmLozenge = evm?.maskingWarning
            ? `<span class="jira-lozenge jira-lozenge-danger">SQUAD VARIANCE ALERT</span>`
            : cpiVal < 0.9 || spiVal < 0.9
                ? `<span class="jira-lozenge jira-lozenge-inprogress">WATCH</span>`
                : `<span class="jira-lozenge jira-lozenge-done">HEALTHY</span>`;
        const squadRows = Object.entries(evm?.byTeam ?? {})
            .map(([teamName, sq]) => `
          <div class="gov-squad-row">
            <span>${escapeHtmlText(teamName)}</span>
            <span>CPI <strong>${sq.cpi.toFixed(2)}</strong> · SPI <strong>${sq.spi.toFixed(2)}</strong></span>
          </div>
        `)
            .join('');
        const stageGateNodes = gov?.stageGateNodes ?? [];
        const retroCal = gov?.lessonsLearntCalibration;
        return `
      <div class="governance-grid">
        <!-- Card 1: 3-Tier Schedule Buffers & Hypercare -->
        <div class="gov-card">
          <div class="gov-card-header">
            <span>1. Schedule Buffers &amp; Hypercare</span>
            ${burnLozenge}
          </div>
          <div class="gov-stat-row">
            <span>Base Target (P50): <strong>${(res?.baseTargetDays ?? activeSim.p50Days).toFixed(1)}d</strong></span>
            <span>PM Buffer (P85-P50): <strong>+${(res?.pmContingencyReserveDays ?? 0).toFixed(1)}d</strong></span>
          </div>
          <div class="gov-stat-row">
            <span>Exec Reserve (CVaR): <strong>+${(res?.managementReserveDays ?? 0).toFixed(1)}d</strong></span>
            <span>Hypercare Buffer: <strong>+${(gov?.hypercareReserveDays ?? 1.5).toFixed(1)}d</strong></span>
          </div>
        </div>

        <!-- Card 2: Engineering Earned Value (Dev-Days) -->
        <div class="gov-card">
          <div class="gov-card-header">
            <span>2. Engineering Earned Value (Dev-Days)</span>
            ${evmLozenge}
          </div>
          <div class="gov-stat-row">
            <span>Effort CPI: <strong>${cpiVal.toFixed(2)}</strong></span>
            <span>Schedule SPI: <strong>${spiVal.toFixed(2)}</strong></span>
            <span>EAC: <strong>${(evm?.eacTrendDays ?? 0).toFixed(1)}d</strong> (BAC ${(evm?.bacDays ?? 0).toFixed(1)}d)</span>
          </div>
          <div class="gov-squad-list">
            ${squadRows}
          </div>
        </div>

        <!-- Card 3: Resource Contention & Handoffs -->
        <div class="gov-card">
          <div class="gov-card-header">
            <span>3. Resource Contention &amp; Handoffs</span>
            <span class="jira-lozenge ${(gov?.overallocatedAssignees.length ?? 0) > 0 ? 'jira-lozenge-inprogress' : 'jira-lozenge-done'}">
              ${gov?.overallocatedAssignees.length ?? 0} OVERLOADED
            </span>
          </div>
          <div class="gov-stat-row">
            <span>Blocked Handoff Idle: <strong>${(gov?.blockedHandoffIdleDays ?? 0).toFixed(1)}d</strong></span>
            <span>SLA Breach Risk: <strong>${Math.round((gov?.slaBreachProbability ?? 0) * 100)}%</strong></span>
          </div>
          ${(gov?.overallocatedAssignees.length ?? 0) > 0
            ? `<div class="gov-sub-note">Parallel Contention: ${escapeHtmlText(gov.overallocatedAssignees.map((a) => `${a.assignee} (${a.utilizationPct}%)`).join(', '))}</div>`
            : `<div class="gov-sub-note">No parallel critical-path assignee multi-tasking detected.</div>`}
        </div>

        <!-- Card 4: Sprint Readiness (DoR) & Retro Calibration -->
        <div class="gov-card">
          <div class="gov-card-header">
            <span>4. Sprint Readiness &amp; Stage Gates</span>
            <span class="jira-lozenge ${(gov?.sprintReadinessScore ?? 100) >= 80 ? 'jira-lozenge-done' : 'jira-lozenge-inprogress'}">
              DoR ${gov?.sprintReadinessScore ?? 100}%
            </span>
          </div>
          <div class="gov-stat-row">
            <span>Stage Gates: <strong>${stageGateNodes.length}</strong> (${escapeHtmlText(stageGateNodes.join(', ') || 'None')})</span>
            <span>Retro Priors: <strong>${retroCal ? `${retroCal.empiricalVelocityRatio}x (${retroCal.completedCount} done)` : '1.0x'}</strong></span>
          </div>
        </div>
      </div>
    `;
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
        statisticalDiagnostics: {
            cvar95TailRiskDate: `${activeSim.cvar95Date} (+${activeSim.cvar95Days}d)`,
            quasimetricLatentEnergyE: activeSim.quasimetricEnergy,
            estimatedReworkHours: `${activeSim.estimatedReworkHours}h`,
            monteCarloIterations: 500,
            registeredMcpTools: MCP_TOOLS_MANIFEST.map((t) => t.name),
        },
    };
    return `
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div class="advanced-math-grid">
        <div class="math-stat-box" title="Conditional Value-at-Risk (CVaR 0.95): Expected finish date across the worst 5% tail-risk simulation runs">
          <span>Worst 5% Tail (CVaR₀.₉₅)</span>
          <strong style="color:#AE2E24;">${formatFriendlyDate(activeSim.cvar95Date, true)}</strong>
        </div>
        <div class="math-stat-box" title="Quasimetric Latent Energy E(s -> s'): Measures asymmetric schedule friction required to recover baseline dates">
          <span>Schedule Friction (E)</span>
          <strong style="color:#0055CC;">${activeSim.quasimetricEnergy}</strong>
        </div>
        <div class="math-stat-box" title="Expected downstream context-switching & interface rework hours">
          <span>Est. Rework Risk</span>
          <strong style="color:#A54800;">${activeSim.estimatedReworkHours} hrs</strong>
        </div>
      </div>
      <pre class="code-console">${escapeHtmlText(JSON.stringify(mcpRpcSample, null, 2))}</pre>
    </div>
  `;
}
function renderScenarioPanel(props) {
    const { graph, baselineSim, activeSim, selectedNodeKey, delayDays, addDeveloper, decoupleBlockingEdges, activeRightTab, copiedPromptNotice, } = props;
    const selectedNode = graph.nodes.find((n) => n.key === selectedNodeKey) ?? graph.nodes[0];
    const selectedStat = activeSim.nodeStats[selectedNode.key];
    const linkedGoal = graph.goals.find((g) => g.id === selectedNode.goalId) ?? graph.goals[0];
    const maxTimelineScale = Math.max(45, baselineSim.p95Days + 8, activeSim.p95Days + 8);
    const pct = (days) => Math.min(100, Math.max(8, Math.round((days / maxTimelineScale) * 100)));
    const delaySignLabel = delayDays > 0
        ? `+${delayDays} Days Delay`
        : delayDays < 0
            ? `${delayDays} Days Faster`
            : '0 Days (Baseline)';
    const activeLozenge = delayDays > 0
        ? `<span class="jira-lozenge jira-lozenge-danger">+${delayDays}D DELAY</span>`
        : delayDays < 0
            ? `<span class="jira-lozenge jira-lozenge-done">${delayDays}D FASTER</span>`
            : addDeveloper || decoupleBlockingEdges
                ? `<span class="jira-lozenge jira-lozenge-done">MITIGATED</span>`
                : `<span class="jira-lozenge jira-lozenge-todo">BASELINE</span>`;
    const uncertaintyLabel = selectedNode.uncertaintySigma >= 1.8
        ? 'High'
        : selectedNode.uncertaintySigma >= 1.0
            ? 'Medium'
            : 'Low';
    const forecastRows = [
        {
            label: 'Likely Finish (50%)',
            tooltip: 'Median P50 Forecast: 50% of simulated runs finish on or before this date.',
            baseDays: baselineSim.p50Days,
            intDays: activeSim.p50Days,
            baseDate: baselineSim.p50Date,
            intDate: activeSim.p50Date,
        },
        {
            label: 'Commit Target (85%)',
            tooltip: 'Recommended P85 Commitment Date: 85% probability of finishing on or before this date.',
            baseDays: baselineSim.p85Days,
            intDays: activeSim.p85Days,
            baseDate: baselineSim.p85Date,
            intDate: activeSim.p85Date,
        },
        {
            label: 'Buffer Cutoff (95%)',
            tooltip: `Conservative P95 Buffer Date. Extreme 5% tail risk (CVaR₀.₉₅) = ${activeSim.cvar95Date}.`,
            baseDays: baselineSim.p95Days,
            intDays: activeSim.p95Days,
            baseDate: baselineSim.p95Date,
            intDate: activeSim.p95Date,
        },
    ];
    return `
    <div class="right-column">
      <!-- What-If Simulator Controls Card -->
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-title">
            <span>What-If Scenario Simulator</span>
            ${renderInfoTooltip('What-If Scenario Simulator', 'Select any issue from your Jira project and test how a delay, acceleration, or resource change affects the overall delivery date and Teamwork Graph goals.', `Active Intervention: do(${selectedNode.key} = ${delayDays >= 0 ? `+${delayDays}d` : `${delayDays}d`})`)}
          </div>
          ${activeLozenge}
        </div>

        <div class="intervention-box">
          <!-- Selected Issue Card -->
          <div class="selected-node-banner">
            <div class="node-banner-top">
              <span class="node-key-tag">${escapeHtmlText(selectedNode.key)}</span>
              ${renderJiraStatusLozenge(selectedNode.status)}
            </div>
            <div class="node-summary-text">${escapeHtmlText(selectedNode.summary)}</div>
            <div class="node-meta-grid">
              <div class="meta-cell">
                <span>Assignee</span>
                <strong>${escapeHtmlText(selectedNode.assignee)}</strong>
              </div>
              <div class="meta-cell">
                <span>Estimate</span>
                <strong>${selectedNode.baseEstimateDays} Days</strong>
              </div>
              <div class="meta-cell" title="Log-normal uncertainty standard deviation σ = ±${selectedNode.uncertaintySigma} days">
                <span>Uncertainty ⓘ</span>
                <strong>${uncertaintyLabel}</strong>
              </div>
              <div class="meta-cell" title="Criticality Index: ${Math.round((selectedStat?.criticalityIndex ?? 0) * 100)}% of Monte Carlo runs place this issue on the critical path">
                <span>Criticality ⓘ</span>
                <strong>${Math.round((selectedStat?.criticalityIndex ?? 0) * 100)}%</strong>
              </div>
            </div>
          </div>

          <!-- Step 1: Schedule Change Slider & Mitigations -->
          <div class="delay-slider-card">
            <div class="slider-header">
              <span class="slider-title">1. Schedule Change (-5d to +30d)</span>
              <span class="slider-readout ${delayDays < 0 ? 'accel-text' : delayDays === 0 ? 'neutral-text' : ''}">
                ${delaySignLabel}
              </span>
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

            <div class="mitigation-label">2. Recovery Mitigations</div>
            <div class="scope-toggles-row">
              <button
                class="scope-toggle-btn ${addDeveloper ? 'active' : ''}"
                id="btn-toggle-add-dev"
                title="Adds +1 FTE with Brooks's Law communication & onboarding drag calibration"
              >
                ${addDeveloper ? '✓ +1 Developer Added' : '+ Add Developer (+1 FTE)'}
              </button>
              <button
                class="scope-toggle-btn ${decoupleBlockingEdges ? 'active' : ''}"
                id="btn-toggle-decouple-edge"
                title="Reduces outgoing blocking dependency propagation weight to 0.25"
              >
                ${decoupleBlockingEdges ? '✓ Dependency Decoupled' : '✂ Decouple Dependency'}
              </button>
            </div>
            ${addDeveloper && activeSim.deliveryGovernance?.brooksLawDiagnostic
        ? `<div class="brooks-advisory-banner" title="Brooks's Law Communication Channels N = n(n-1)/2 & Onboarding Mentoring Drag">
                     <span><strong>Brooks's Law:</strong> Net <strong>${activeSim.deliveryGovernance.brooksLawDiagnostic.netAccelerationDays >= 0
            ? `${activeSim.deliveryGovernance.brooksLawDiagnostic.netAccelerationDays}d saved`
            : `${Math.abs(activeSim.deliveryGovernance.brooksLawDiagnostic.netAccelerationDays)}d slower`}</strong> (Onboarding drag ${activeSim.deliveryGovernance.brooksLawDiagnostic.onboardingPenaltyDays}d · Channels N: ${activeSim.deliveryGovernance.brooksLawDiagnostic.communicationChannelsBefore} → ${activeSim.deliveryGovernance.brooksLawDiagnostic.communicationChannelsAfter})</span>
                   </div>`
        : ''}
          </div>

          <!-- Step 2: Release Date Comparison Bars -->
          <div class="comparison-bars-card">
            <div style="font-size:12px;font-weight:700;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center;">
              <span>Projected Release Impact</span>
              ${renderInfoTooltip('Baseline vs. Simulated Forecast', `Compares your baseline schedule against the simulated What-If change across 500 paired runs. Worst 5% Tail Date: ${formatFriendlyDate(activeSim.cvar95Date, true)}.`, `ΔP85 = ${(activeSim.p85Days - baselineSim.p85Days).toFixed(1)}d | CVaR₀.₉₅ = ${activeSim.cvar95Date}`)}
            </div>

            ${forecastRows
        .map((row) => {
        const diff = Number((row.intDays - row.baseDays).toFixed(1));
        const intBarColor = diff > 0 ? '#CA3521' : diff < 0 ? '#1F845A' : '#0C66E4';
        const diffBadge = diff > 0
            ? `<span style="color:#AE2E24;font-weight:700;">(+${diff}d)</span>`
            : diff < 0
                ? `<span style="color:#216E4E;font-weight:700;">(${diff}d)</span>`
                : `<span style="color:#626F86;">(0d)</span>`;
        return `
                  <div class="dist-compare-group" title="${escapeHtmlText(row.tooltip)}">
                    <div class="dist-compare-label">
                      <strong>${escapeHtmlText(row.label)}</strong>
                      <span>
                        ${formatFriendlyDate(row.baseDate)} → <strong>${formatFriendlyDate(row.intDate)}</strong> ${diffBadge}
                      </span>
                    </div>
                    <div class="dual-bar-stack">
                      <div class="bar-track-line">
                        <div class="bar-fill-base" style="width:${pct(row.baseDays)}%;"></div>
                      </div>
                      <div class="bar-track-line">
                        <div class="bar-fill-sim" style="width:${pct(row.intDays)}%;background:${intBarColor};"></div>
                      </div>
                    </div>
                  </div>
                `;
    })
        .join('')}

            <button class="btn btn-primary btn-rovo-copy" id="btn-copy-rovo-prompt" title="Copy prompt for @Rovo-World-Model Agent in Rovo Chat">
              ${copiedPromptNotice ? '✓ Copied Prompt for @Rovo-World-Model Agent!' : '✨ Ask @Rovo-World-Model Agent'}
            </button>
          </div>
        </div>
      </div>

      <!-- Teamwork Graph Goals Card -->
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-title">
            <span>Teamwork Graph Goals</span>
            ${renderInfoTooltip('Teamwork Graph Goal Alignment', 'Tracks how issue schedule changes ripple up to linked Teamwork Graph Goals.')}
          </div>
          <span class="jira-lozenge jira-lozenge-goal">${activeSim.goalImpacts.length} GOALS</span>
        </div>
        <div class="goals-list">
          ${activeSim.goalImpacts
        .map((goal) => {
        const statusClass = goal.status === 'Off Track'
            ? 'off-track'
            : goal.status === 'At Risk'
                ? 'at-risk'
                : '';
        const probPct = Math.round(goal.probabilityOfOnTime * 100);
        const barColor = goal.status === 'Off Track'
            ? '#CA3521'
            : goal.status === 'At Risk'
                ? '#D97706'
                : '#1F845A';
        const shiftSign = goal.rippleDelayDays > 0
            ? `+${goal.rippleDelayDays}d`
            : goal.rippleDelayDays < 0
                ? `${goal.rippleDelayDays}d`
                : '';
        return `
                <div class="goal-card ${statusClass}" title="Goal Key: ${escapeHtmlText(goal.goalKey)} | Owner: ${escapeHtmlText(goal.ownerTeam)}">
                  <div class="goal-top">
                    <div>
                      <div class="goal-name">${escapeHtmlText(goal.goalName)}</div>
                      <div style="font-size:11px;color:var(--text-secondary);">
                        Owner: ${escapeHtmlText(goal.ownerTeam)}
                      </div>
                    </div>
                    ${renderJiraStatusLozenge(goal.status)}
                  </div>
                  <div class="goal-dates-row">
                    <span>Target: <strong>${formatFriendlyDate(goal.targetDate)}</strong></span>
                    <span>Projected: <strong>${formatFriendlyDate(goal.p85CompletionDate)}</strong> ${shiftSign ? `<em style="color:${goal.rippleDelayDays > 0 ? '#AE2E24' : '#216E4E'};">(${shiftSign})</em>` : ''}</span>
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

      <!-- Inspector Tabs -->
      <div class="panel-card">
        <div class="tab-bar">
          <button class="tab-btn ${activeRightTab === 'cascade' ? 'active' : ''}" data-tab="cascade">
            Impacted (${activeSim.blastRadiusNodes.length})
          </button>
          <button class="tab-btn ${activeRightTab === 'bottlenecks' ? 'active' : ''}" data-tab="bottlenecks">
            Blockers (${activeSim.topBottlenecks.length})
          </button>
          <button class="tab-btn ${activeRightTab === 'governance' ? 'active' : ''}" data-tab="governance">
            Delivery Health
          </button>
          <button class="tab-btn ${activeRightTab === 'rovo-mcp' ? 'active' : ''}" data-tab="rovo-mcp">
            Math &amp; MCP
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
 * Rovo-World-Model — Main Custom UI Cockpit Controller (`static/ui/src/cockpit.ts`)
 *
 * Uses Atlassian Forge's `window.__bridge.callBridge('invoke', ...)` to load real Jira projects
 * (e.g., `BloomPath Sprint (BLP)`, `Triton (TRI)`) and their live issues directly from Jira Cloud.
 */
/**
 * Invokes Atlassian Forge Custom UI resolver via `window.__bridge.callBridge('invoke', ...)`
 * (the native runtime channel used by `@forge/bridge` inside Jira Cloud iframes).
 */
async function invokeForgeResolver(functionKey, payload = {}) {
    try {
        const win = window;
        if (win.__bridge && typeof win.__bridge.callBridge === 'function') {
            return await win.__bridge.callBridge('invoke', {
                functionKey,
                payload,
            });
        }
        if (win.__forgeBridge && typeof win.__forgeBridge.invoke === 'function') {
            return await win.__forgeBridge.invoke(functionKey, payload);
        }
    }
    catch {
        // Fallback when running outside Jira iframe
    }
    return null;
}
/**
 * Builds the default initial graph from real Jira project issues (`BloomPath Sprint (BLP)`)
 * while the live `getGraphData` bridge call completes.
 */
function createInitialRealProjectGraph(projectKey = 'BLP', projectName = 'BloomPath Sprint') {
    const dag = buildDAGFromJiraIssues(projectKey, [
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
    ], [
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
    ], [
        {
            id: 'team-1',
            name: `${projectName} Engineering`,
            lead: 'Petri Paananen',
            color: '#0C66E4',
            cognitiveLoad: 65,
        },
    ], '2026-10-30');
    return {
        ...dag,
        projectName,
        isSyntheticDemo: false,
    };
}
const initialGraph = createInitialRealProjectGraph('BLP', 'BloomPath Sprint');
const initialBaseline = runMonteCarloSimulation(initialGraph, { iterations: 500 });
const state = {
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
    statusBanner: 'Connected to Jira project — Click any issue card or drag the Schedule Change slider to simulate timeline impacts.',
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
function renderCockpit(activeSliderId) {
    const root = document.getElementById('app-root');
    if (!root)
        return;
    const hasActiveIntervention = state.delayDays !== 0 || state.addDeveloper || state.decoupleBlockingEdges;
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
                readoutEl.className = `slider-value-readout ${state.delayDays > 0
                    ? 'delay-positive'
                    : state.delayDays < 0
                        ? 'delay-negative'
                        : 'delay-zero'}`;
            }
            scenarioMount
                .querySelectorAll('[data-preset-delay]')
                .forEach((btn) => {
                const d = Number(btn.getAttribute('data-preset-delay') ?? 0);
                btn.classList.toggle('active', d === state.delayDays);
            });
        }
        else if (activeSliderId === 'time-machine-range') {
            scenarioMount.innerHTML = scenarioHtml;
            scrubberMount
                .querySelectorAll('[data-epoch-idx]')
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
async function loadJiraProjectGraph(projectKey) {
    const remoteData = await invokeForgeResolver('getGraphData', projectKey ? { projectKey } : {});
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
        state.statusBanner = `Loaded live Jira project "${state.graph.projectName}" (${state.graph.projectKey}) with ${state.graph.nodes.length} ${state.graph.nodes.length === 1 ? 'issue' : 'issues'}.`;
        renderCockpit();
    }
    else if (projectKey) {
        const matched = state.availableProjects.find((p) => p.key === projectKey);
        state.graph = createInitialRealProjectGraph(projectKey, matched?.name ?? `${projectKey} Project`);
        state.selectedNodeKey = state.graph.nodes[0]?.key ?? `${projectKey}-1`;
        state.delayDays = 0;
        recomputeSimulation();
        renderCockpit();
    }
}
function attachCockpitEventListeners(skipMountForSlider) {
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
    const projectSelect = document.getElementById('jira-project-select');
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
        el.addEventListener('mouseenter', (evt) => {
            if (!hoverCard || !viewportContainer)
                return;
            const rawHover = el.getAttribute('data-node-hover');
            if (!rawHover)
                return;
            try {
                const info = JSON.parse(rawHover);
                const shiftLine = info.rippleShift > 0
                    ? `<span style="color:#AE2E24;font-weight:700;">+${info.rippleShift.toFixed(1)}d downstream slip</span>`
                    : info.rippleShift < 0
                        ? `<span style="color:#216E4E;font-weight:700;">${info.rippleShift.toFixed(1)}d faster</span>`
                        : `<span style="color:#626F86;">On Baseline Schedule</span>`;
                const floatDays = info.totalFloatDays ?? 0;
                const floatBadge = floatDays < 0
                    ? `<strong style="color:#AE2E24;">${floatDays.toFixed(1)}d (Super-Critical)</strong>`
                    : floatDays === 0
                        ? `<strong style="color:#A54800;">0.0d (Critical Path)</strong>`
                        : `<strong style="color:#216E4E;">+${floatDays.toFixed(1)}d Slack</strong>`;
                const stepPct = info.completionStepPct ?? 0;
                const stepLabel = stepPct === 75
                    ? '75% (Awaiting Handoff)'
                    : stepPct === 100
                        ? '100% (Accepted)'
                        : `${stepPct}%`;
                hoverCard.innerHTML = `
          <div class="hover-card-header">
            <span class="hover-card-key">${escapeHtmlText(info.key)}${info.isStageGate ? ' · STAGE GATE' : ''}</span>
            <span class="jira-lozenge jira-lozenge-todo">${escapeHtmlText(info.status.toUpperCase())}</span>
          </div>
          <div class="hover-card-title">${escapeHtmlText(info.summary)}</div>
          <div class="hover-card-meta">
            <div><span>Assignee:</span> <strong>${escapeHtmlText(info.assignee)}</strong></div>
            <div><span>Projected Finish:</span> <strong>${escapeHtmlText(info.p85Date)}</strong></div>
            <div><span>Deadline Float:</span> ${floatBadge}</div>
            <div><span>Completion Step:</span> <strong>${stepLabel}</strong></div>
            <div><span>Schedule Impact:</span> ${shiftLine}</div>
            <div><span>Linked Goal:</span> <strong>${escapeHtmlText(info.goalName)}</strong></div>
          </div>
          ${info.adr
                    ? `<div class="hover-card-adr">📄 ${escapeHtmlText(info.adr)}</div>`
                    : ''}
          <div class="hover-card-math">
            📐 <code>PERT M = ${(info.pertMean ?? info.estimateDays).toFixed(1)}d (σ = ±${(info.pertSigma ?? info.sigma).toFixed(1)}d) | Crit = ${info.criticalityPct}%</code>
          </div>
          <div class="hover-card-tip">Click issue card to select &amp; simulate</div>
        `;
                hoverCard.style.display = 'block';
                const vpRect = viewportContainer.getBoundingClientRect();
                const mouseX = evt.clientX - vpRect.left + viewportContainer.scrollLeft;
                const mouseY = evt.clientY - vpRect.top + viewportContainer.scrollTop;
                const leftPos = Math.min(Math.max(12, mouseX + 16), viewportContainer.scrollWidth - 310);
                const topPos = Math.max(12, mouseY - 24);
                hoverCard.style.left = `${leftPos}px`;
                hoverCard.style.top = `${topPos}px`;
            }
            catch {
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
        const delaySlider = document.getElementById('delay-slider-input');
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
        document.querySelectorAll('[data-preset-delay]').forEach((btn) => {
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
                }
                catch {
                    // Fallback when clipboard permission is restricted in sandboxed iframe
                }
                state.copiedPromptNotice = true;
                state.statusBanner = `Copied Rovo Prompt — open Rovo Chat in Jira and paste to ask @Rovo-World-Model Agent!`;
                renderCockpit();
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
                        state.delayDays = 5;
                    recomputeSimulation();
                    renderCockpit();
                }
            });
        });
    }
    if (skipMountForSlider !== 'time-machine-range') {
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
            const res = await invokeForgeResolver('createRealJiraIssues', { projectKey: state.graph.projectKey });
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
            const topKey = state.activeSim.topBottlenecks[0]?.key ??
                state.graph.nodes[0]?.key ??
                'BLP-7';
            state.selectedNodeKey = topKey;
            if (state.delayDays === 0)
                state.delayDays = 5;
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

})();
