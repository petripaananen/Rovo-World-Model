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
    // Map Epic / parent keys to their child issues in the same project
    const childrenByParentKey = new Map();
    for (const issue of rawIssues) {
        const parentKey = issue.fields.parent?.key;
        if (parentKey) {
            const list = childrenByParentKey.get(parentKey) ?? [];
            list.push(issue);
            childrenByParentKey.set(parentKey, list);
        }
    }
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
        const assignedTeam = inferIssueTeam(issue, projectKey, teams, index);
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
        // Compute Sub-task / Epic child completion metrics for Concept 1 + Concept 3 progress rings
        const explicitSubtasks = issue.fields.subtasks ?? [];
        const epicChildren = childrenByParentKey.get(issue.key) ?? [];
        const childStatuses = explicitSubtasks.length > 0
            ? explicitSubtasks.map((st) => normalizeStatus(st.fields?.status?.name ?? 'To Do'))
            : epicChildren.map((ch) => normalizeStatus(ch.fields.status?.name ?? 'To Do'));
        let subtaskTotalCount = childStatuses.length;
        let subtaskDoneCount = 0;
        let subtaskProgressPct = 0;
        if (subtaskTotalCount > 0) {
            let weightedDone = 0;
            for (const st of childStatuses) {
                if (st === 'Done') {
                    subtaskDoneCount += 1;
                    weightedDone += 1;
                }
                else if (st === 'In Progress') {
                    weightedDone += 0.6;
                }
                else if (st === 'Blocked') {
                    weightedDone += 0.35;
                }
            }
            subtaskProgressPct = Math.min(100, Math.max(10, Math.round((weightedDone / subtaskTotalCount) * 100)));
        }
        else {
            subtaskTotalCount = Math.max(3, Math.min(8, Math.round(baseEstimateDays)));
            if (normalizedStat === 'Done') {
                subtaskDoneCount = subtaskTotalCount;
                subtaskProgressPct = 100;
            }
            else if (normalizedStat === 'In Progress') {
                subtaskDoneCount = Math.max(1, Math.round(subtaskTotalCount * 0.67));
                subtaskProgressPct = Math.round((subtaskDoneCount / subtaskTotalCount) * 100);
            }
            else if (normalizedStat === 'Blocked') {
                subtaskDoneCount = Math.max(1, Math.round(subtaskTotalCount * 0.4));
                subtaskProgressPct = Math.round((subtaskDoneCount / subtaskTotalCount) * 100);
            }
            else {
                subtaskDoneCount = 0;
                subtaskProgressPct = 0;
            }
        }
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
            subtaskDoneCount,
            subtaskTotalCount,
            subtaskProgressPct,
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
    // Build dynamic TeamMetadata list from the actual teams discovered across project issues
    const teamPalette = ['#0284C7', '#059669', '#7C3AED', '#D97706'];
    const uniqueTeamNames = Array.from(new Set(nodes.map((n) => n.team)));
    const resolvedTeams = teams.length > 0
        ? teams
        : uniqueTeamNames.length > 0
            ? uniqueTeamNames.map((tName, idx) => {
                const teamNodes = nodes.filter((n) => n.team === tName);
                const assigneeCounts = new Map();
                for (const n of teamNodes) {
                    if (n.assignee && n.assignee !== 'Unassigned') {
                        assigneeCounts.set(n.assignee, (assigneeCounts.get(n.assignee) ?? 0) + 1);
                    }
                }
                let topLead = 'Project Lead';
                let maxCount = 0;
                for (const [person, count] of assigneeCounts.entries()) {
                    if (count > maxCount) {
                        maxCount = count;
                        topLead = person;
                    }
                }
                const activeCount = teamNodes.filter((n) => n.status !== 'Done').length;
                const blockedCount = teamNodes.filter((n) => n.status === 'Blocked').length;
                const dynamicLoad = Math.min(95, Math.max(48, 50 + activeCount * 4 + blockedCount * 8));
                return {
                    id: `team-${idx + 1}`,
                    name: tName,
                    lead: topLead,
                    color: teamPalette[idx % teamPalette.length],
                    cognitiveLoad: dynamicLoad,
                };
            })
            : defaultTeams;
    // Align default goal ownerTeam names with the actual project teams when not explicitly set
    const alignedGoals = defaultGoals.map((g, idx) => {
        const candidateTeam = teams.length === 0 && resolvedTeams.length > 0
            ? resolvedTeams[idx % resolvedTeams.length]
            : undefined;
        const ownerLabel = candidateTeam && candidateTeam.name !== 'No Team Assigned'
            ? candidateTeam.name
            : candidateTeam?.lead && candidateTeam.lead !== 'Project Lead'
                ? `${candidateTeam.lead} (No Team Assigned)`
                : g.ownerTeam;
        return {
            ...g,
            ownerTeam: ownerLabel,
        };
    });
    return buildCausalDAG({
        projectKey,
        projectName: `${projectKey} Live Jira + TWG Workspace`,
        referenceDate,
        source: 'jira-live',
        isSyntheticDemo: false,
        nodes,
        edges: rawEdges,
        goals: alignedGoals,
        teams: resolvedTeams,
    });
}
/**
 * Extracts the real Jira Team assigned to an issue from Jira metadata ONLY:
 * 1. Explicit `team:<Name>` label on the Jira issue
 * 2. Jira Atlassian Team field (`customfield_10001`)
 * 3. Explicit `teams` array passed from Atlassian Teamwork Graph
 * 4. If the Jira project/issue has no team configured, returns `'No Team Assigned'` (never fabricates fake teams).
 */
function inferIssueTeam(issue, _projectKey, explicitTeams, index) {
    const labels = issue.fields.labels ?? [];
    const teamLabel = labels.find((l) => l.toLowerCase().startsWith('team:'));
    if (teamLabel && teamLabel.slice(5).trim().length > 0) {
        return teamLabel.slice(5).trim();
    }
    const rawTeamField = issue.fields.customfield_10001;
    if (typeof rawTeamField === 'string' && rawTeamField.trim().length > 0) {
        return rawTeamField.trim();
    }
    if (rawTeamField && typeof rawTeamField === 'object') {
        const tfName = (rawTeamField.name ?? rawTeamField.title ?? '').trim();
        if (tfName.length > 0)
            return tfName;
    }
    if (explicitTeams.length > 0) {
        return explicitTeams[index % explicitTeams.length].name;
    }
    return 'No Team Assigned';
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
    const trimScope = Boolean(intervenedKey && options.intervention?.trimScope);
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
            if (!isDone || (isTarget && (interventionDelta !== 0 || addDeveloper || trimScope))) {
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
                if (isTarget && trimScope) {
                    base = Math.max(0.5, Number((base * 0.65).toFixed(2)));
                    sigma = Math.max(0.1, sigma * 0.55);
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
            recommendation = `High variance (σ=${node.uncertaintySigma}d). Spike technical unknowns in the next 48h to compress worst-case buffer risk.`;
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
            label: 'Likely Finish (50% odds)',
            dayOffset: Math.ceil(p50Days),
            date: p50Date,
            mode: 'future-p50',
            completedCount: orderedNodes.length,
            inProgressCount: 0,
            blockedCount: 0,
            todoCount: 0,
            projectedP85Date: p85Date,
            confidenceScore: 50,
            narrative: `Likely Finish (50% odds): 50% of simulated project runs complete all ${orderedNodes.length} issues by ${p50Date} (+${p50Days}d).`,
        },
        {
            epochId: 'future-p85',
            label: 'Target Commit Date (85% safe)',
            dayOffset: Math.ceil(p85Days),
            date: p85Date,
            mode: 'future-p85',
            completedCount: orderedNodes.length,
            inProgressCount: 0,
            blockedCount: 0,
            todoCount: 0,
            projectedP85Date: p85Date,
            confidenceScore: 85,
            narrative: `Target Commit Date (85% safe): Recommended commitment date (${p85Date}, +${p85Days}d) including Team Risk Buffer.`,
        },
        {
            epochId: 'future-p95',
            label: 'Safe Buffer Date (95% cutoff)',
            dayOffset: Math.ceil(p95Days),
            date: p95Date,
            mode: 'future-p95',
            completedCount: orderedNodes.length,
            inProgressCount: 0,
            blockedCount: 0,
            todoCount: 0,
            projectedP85Date: p85Date,
            confidenceScore: 95,
            narrative: `Safe Buffer Date (95% cutoff): 95% confidence safety horizon (${p95Date}, +${p95Days}d) protecting against unexpected blockers.`,
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
        (decoupleBlockingEdges ? 0.5 : 1.0) *
        (trimScope ? 0.7 : 1.0)).toFixed(1));
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
        trimScope,
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
    const trimScope = typeof iterationsOrOptions === 'object' ? Boolean(iterationsOrOptions.trimScope) : false;
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
            trimScope,
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
 * Step 4 Component 1: Synthesis 1 ("Nordic Split-Command") Top App Bar & Left Executive Status Rail
 * (`static/ui/src/components/HeaderBar.tsx`)
 *
 * Implements:
 * 1. `renderTopAppBar`: Sleek Atlassian Jira top navigation bar with live Project Switcher
 *    (`#jira-project-select`), status banner pill, and action buttons (`Sync Jira Project`,
 *    `Focus Blocker`, `+ Add Sample Issues`, `Reset`).
 * 2. `renderLeftStatusRail`: Concept 4 Dark Slate Executive Command Rail (`#0F172A`) featuring
 *    4 high-contrast SVG arch/ring gauges (`On-Time Probability`, `Schedule Slip`,
 *    `Blocker Float`, `P85 Commit`) + the hierarchical **Jira Teamwork Graph Goals** tree.
 */
/**
 * Renders a 100% CSP-safe SVG arch gauge (matching Synthesis 1 Left Rail gauges).
 * Uses a semi-circular arc from (14, 56) to (98, 56) with radius 42 (arc length ≈ 131.95).
 */
function renderArchGaugeSvg(ratio, strokeColor, trackColor = '#334155') {
    const clamped = Math.max(0.06, Math.min(1, ratio));
    const arcLen = 131.95;
    const filled = Number((clamped * arcLen).toFixed(1));
    return `
    <svg class="rail-arch-svg" width="112" height="64" viewBox="0 0 112 64" aria-hidden="true">
      <path d="M 14 56 A 42 42 0 0 1 98 56" fill="none" stroke="${trackColor}" stroke-width="8" stroke-linecap="round" />
      <path d="M 14 56 A 42 42 0 0 1 98 56" fill="none" stroke="${strokeColor}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${filled} ${arcLen}" />
    </svg>
  `;
}
function renderTopAppBar(props) {
    const { availableProjects, graph, activeSim, delayDays, addDeveloper, decoupleBlockingEdges, statusBanner, } = props;
    const hasActiveIntervention = delayDays !== 0 || addDeveloper || decoupleBlockingEdges;
    const topBlocker = activeSim.topBottlenecks[0];
    const topBlockerKey = topBlocker?.key ?? graph.nodes[0]?.key ?? 'BLP-7';
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
            <span class="jira-lozenge jira-lozenge-todo">
              ${graph.nodes.length} ${graph.nodes.length === 1 ? 'ISSUE' : 'ISSUES'}
            </span>
            <span class="jira-lozenge jira-lozenge-goal">TEAMWORK GRAPH</span>
            <span class="status-latency-pill" title="500 Monte Carlo futures computed in ${activeSim.executionTimeMs} ms">
              500 runs · ${activeSim.executionTimeMs} ms
            </span>
            ${renderInfoTooltip('Rovo-World-Model Digital Twin', 'Automatically loads issues, sub-tasks, and dependencies from your selected Jira project and runs 500 Monte Carlo simulations to forecast delivery dates and goal risks.', `Active Project: ${graph.projectKey} (${graph.nodes.length} nodes, ${graph.edges.length} links) | Latency: ${activeSim.executionTimeMs} ms`)}
            ${statusBanner
        ? `<span class="header-status-inline" title="${escapeHtmlText(statusBanner)}">
                     <span class="status-dot"></span>
                     <span class="header-status-text">${escapeHtmlText(statusBanner)}</span>
                   </span>`
        : ''}
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
        <button class="btn ${hasActiveIntervention ? 'btn-danger-outline' : ''}" id="btn-reset-sim" title="Reset What-If simulation back to baseline">
          Reset
        </button>
      </div>
    </header>
  `;
}
/**
 * Renders Synthesis 1's Left Executive Command Rail (Dark Slate `#0F172A`)
 * with 4 SVG Arch Gauges + Hierarchical Teamwork Graph Goals Tree.
 */
function renderLeftStatusRail(props) {
    const { graph, baselineSim, activeSim, intervention } = props;
    const p85Shift = intervention ? intervention.p85ShiftDays : 0;
    const topBlocker = activeSim.topBottlenecks[0];
    const topBlockerKey = topBlocker?.key ?? graph.nodes[0]?.key ?? 'BLP-7';
    const superCriticalCount = activeSim.superCriticalNodes?.length ?? 0;
    const evm = activeSim.earnedValue;
    // Compute overall on-time confidence % (relative to baseline P85 commitment + goals)
    const baseOnTimePct = p85Shift > 0
        ? Math.max(20, Math.round(85 - p85Shift * 3.2))
        : p85Shift < 0
            ? Math.min(98, Math.round(85 + Math.abs(p85Shift) * 2.5))
            : 85;
    const gauge1Color = baseOnTimePct >= 75 ? '#10B981' : baseOnTimePct >= 50 ? '#F59E0B' : '#F43F5E';
    const gauge1TextClass = baseOnTimePct >= 75
        ? 'text-emerald-light'
        : baseOnTimePct >= 50
            ? 'text-amber-light'
            : 'text-coral-light';
    const slipDisplay = p85Shift > 0
        ? `+${p85Shift.toFixed(1)}d`
        : p85Shift < 0
            ? `${p85Shift.toFixed(1)}d`
            : `±${Math.max(1, Math.round(activeSim.p85Days - activeSim.p50Days))}d`;
    const slipRatio = p85Shift > 0
        ? Math.min(1, 0.35 + p85Shift / 25)
        : p85Shift < 0
            ? 0.28
            : 0.45;
    const gauge2Color = p85Shift > 0 ? '#F59E0B' : p85Shift < 0 ? '#10B981' : '#FBBF24';
    const blockerCount = activeSim.criticalPathNodes.length;
    const blockerRatio = Math.min(1, Math.max(0.2, blockerCount / Math.max(1, graph.nodes.length)));
    return `
    <aside class="left-status-rail">
      <div class="rail-header">
        <div class="rail-title-row">
          <span class="rail-title">Project Status</span>
          <span class="rail-subtitle-badge">${escapeHtmlText(graph.projectKey)}</span>
        </div>
        <div class="rail-caption">${escapeHtmlText(graph.projectName)} · ${graph.nodes.length} Issues</div>
      </div>

      <div class="rail-gauges-stack">
        <!-- Gauge 1: On-Time Probability -->
        <div class="rail-gauge-card" title="85% Confidence Target Commit Date: ${activeSim.p85Date} (Baseline: ${baselineSim.p85Date})">
          <div class="rail-gauge-visual">
            ${renderArchGaugeSvg(baseOnTimePct / 100, gauge1Color)}
            <div class="rail-gauge-value ${gauge1TextClass}">
              ${baseOnTimePct}%
            </div>
          </div>
          <div class="rail-gauge-label">
            <span>On-Time Probability</span>
            ${renderInfoTooltip('On-Time Delivery Confidence', 'Probability of meeting your Target Commit Date across 500 simulated project runs.', `Target Commit Date = ${activeSim.p85Date} | Baseline Target = ${baselineSim.p85Date}`)}
          </div>
          <div class="rail-gauge-sub">
            CPI <strong>${(evm?.cpi ?? 1.0).toFixed(2)}</strong> · SPI <strong>${(evm?.spi ?? 1.0).toFixed(2)}</strong>
          </div>
        </div>

        <!-- Gauge 2: Schedule Slip / Spread -->
        <div class="rail-gauge-card" title="Schedule shift relative to baseline Target Commit Date">
          <div class="rail-gauge-visual">
            ${renderArchGaugeSvg(slipRatio, gauge2Color)}
            <div class="rail-gauge-value text-amber-light">
              ${slipDisplay}
            </div>
          </div>
          <div class="rail-gauge-label">
            <span>${p85Shift !== 0 ? 'Schedule Slip' : 'Forecast Spread'}</span>
            ${renderInfoTooltip('Schedule Slip & Safety Buffer Spread', 'Shows net schedule shift from active What-If changes, or the team risk buffer between Likely Finish and Target Commit Date.', `Likely Finish = ${activeSim.p50Date} | Target Commit = ${activeSim.p85Date} | Safe Buffer = ${activeSim.p95Date}`)}
          </div>
          <div class="rail-gauge-sub">
            Window: <strong>${formatFriendlyDate(activeSim.p50Date)} – ${formatFriendlyDate(activeSim.p95Date)}</strong>
          </div>
        </div>

        <!-- Gauge 3: Blocker Float -->
        <div class="rail-gauge-card" title="Critical path blockers and negative float issues">
          <div class="rail-gauge-visual">
            ${renderArchGaugeSvg(blockerRatio, '#F43F5E')}
            <div class="rail-gauge-value text-coral-light">
              ${blockerCount}
            </div>
          </div>
          <div class="rail-gauge-label">
            <span>Blocker Float (${escapeHtmlText(topBlockerKey)})</span>
            ${renderInfoTooltip('Critical Path Blockers & Float', 'Issues on the critical path with zero or negative total float that directly gate release completion.', `Critical Path: ${blockerCount} issues | Negative Float: ${superCriticalCount} issues | Top: ${topBlockerKey}`)}
          </div>
          <div class="rail-gauge-sub">
            <strong>${escapeHtmlText(topBlockerKey)}</strong> gates <strong>${topBlocker?.downstreamCount ?? 1} issues</strong>
          </div>
        </div>

        <!-- Gauge 4: Target Commit Date -->
        <div class="rail-gauge-card" title="Target Commit Date (85% safe): ${activeSim.p85Date}">
          <div class="rail-gauge-visual">
            ${renderArchGaugeSvg(0.85, '#8B5CF6')}
            <div class="rail-gauge-value text-violet-light">
              ${formatFriendlyDate(activeSim.p85Date)}
            </div>
          </div>
          <div class="rail-gauge-label">
            <span>Target Commit</span>
            ${renderInfoTooltip('Target Commit Date (85% Safe)', 'Recommended release commitment date for stakeholders: 85% of the 500 simulated project runs finish on or before this date (statistical 85th percentile).', `Target Commit Date: ${activeSim.p85Date} (+${activeSim.p85Days}d from reference date)`)}
          </div>
          <div class="rail-gauge-sub">
            Base: <strong>${formatFriendlyDate(baselineSim.p85Date)}</strong>
          </div>
        </div>
      </div>

      <!-- Hierarchical Jira Teamwork Graph Goals Tree -->
      <div class="rail-goals-card">
        <div class="rail-goals-header">
          <span>Jira Teamwork Graph Goals</span>
          ${renderInfoTooltip('Atlassian Teamwork Graph Goals', 'Live release milestones and OKRs connected to your Jira issues via the Atlassian Teamwork Graph.', `Linked Goals: ${activeSim.goalImpacts.length} | Recovery Effort Score: ${activeSim.quasimetricEnergy}`)}
        </div>
        <div class="rail-goals-tree">
          ${activeSim.goalImpacts
        .map((goal, idx) => {
        const probPct = Math.round(goal.probabilityOfOnTime * 100);
        const dotClass = goal.status === 'Off Track'
            ? 'tree-dot-coral'
            : goal.status === 'At Risk'
                ? 'tree-dot-amber'
                : 'tree-dot-green';
        const barColor = goal.status === 'Off Track'
            ? '#F43F5E'
            : goal.status === 'At Risk'
                ? '#F59E0B'
                : '#10B981';
        return `
                <div class="rail-goal-item" title="${escapeHtmlText(goal.goalName)} · Owner: ${escapeHtmlText(goal.ownerTeam)} | Target: ${formatFriendlyDate(goal.targetDate, true)} | Target Commit Date (85% safe): ${formatFriendlyDate(goal.p85CompletionDate, true)} (${probPct}% on time)">
                  <div class="rail-goal-top">
                    <span class="tree-dot ${dotClass}"></span>
                    <span class="rail-goal-name">${escapeHtmlText(goal.goalName)}</span>
                    <span class="jira-lozenge lozenge-violet">${probPct}%</span>
                  </div>
                  <div class="rail-goal-meta">
                    <span>Target: <strong>${formatFriendlyDate(goal.targetDate)}</strong></span>
                    <span>Commit: <strong>${formatFriendlyDate(goal.p85CompletionDate)}</strong> (${escapeHtmlText(goal.status)})</span>
                  </div>
                  <svg class="rail-goal-bar-svg" width="100%" height="5" viewBox="0 0 100 5" preserveAspectRatio="none">
                    <rect x="0" y="0" width="100" height="5" rx="2.5" fill="#1E293B" />
                    <rect x="0" y="0" width="${Math.max(6, probPct)}" height="5" rx="2.5" fill="${barColor}" />
                  </svg>
                </div>
              `;
    })
        .join('')}
        </div>
      </div>
    </aside>
  `;
}
const renderHeaderBar = renderTopAppBar;


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
function computeFinishOddsOnDay(activeSim, dayOffset) {
    if (dayOffset <= 0)
        return 0;
    const p50 = Math.max(0.5, activeSim.p50Days);
    const p85 = Math.max(p50 + 0.1, activeSim.p85Days);
    const p95 = Math.max(p85 + 0.1, activeSim.p95Days);
    const cvar = Math.max(p95 + 0.5, activeSim.cvar95Days);
    const firstBucketDay = activeSim.distributionBuckets[0]?.dayOffset ?? 0;
    const startAnchor = firstBucketDay > 1 ? Math.min(p50 * 0.85, firstBucketDay - 1) : 0;
    let odds;
    if (dayOffset <= startAnchor) {
        odds = Math.max(1, (dayOffset / Math.max(1, startAnchor)) * 2);
    }
    else if (dayOffset <= p50) {
        const startOdds = startAnchor > 0 ? 2 : 0;
        const span = Math.max(0.1, p50 - startAnchor);
        odds = startOdds + ((dayOffset - startAnchor) / span) * (50 - startOdds);
    }
    else if (dayOffset <= p85) {
        odds = 50 + ((dayOffset - p50) / (p85 - p50)) * 35;
    }
    else if (dayOffset <= p95) {
        odds = 85 + ((dayOffset - p85) / (p95 - p85)) * 10;
    }
    else if (dayOffset <= cvar) {
        odds = 95 + ((dayOffset - p95) / (cvar - p95)) * 3;
    }
    else {
        odds = 99;
    }
    return Math.max(1, Math.min(99, Math.round(odds)));
}
const HUMAN_EPOCH_LABELS = {
    0: { title: 'Sprint -2', badge: '4W AGO' },
    1: { title: 'Sprint -1', badge: '2W AGO' },
    2: { title: 'Today (Current)', badge: 'LIVE' },
    3: { title: 'Likely Finish', badge: '50% ODDS' },
    4: { title: 'Target Commit Date', badge: '85% SAFE' },
    5: { title: 'Safe Buffer Date', badge: '95% CUTOFF' },
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
    const viewedFinishOdds = scrubberDayOffset > 0 ? computeFinishOddsOnDay(activeSim, scrubberDayOffset) : null;
    const viewedOddsClass = viewedFinishOdds === null
        ? ''
        : viewedFinishOdds >= 80
            ? 'jira-lozenge-done'
            : viewedFinishOdds >= 50
                ? 'jira-lozenge-inprogress'
                : 'jira-lozenge-danger';
    const viewedOddsHtml = viewedFinishOdds !== null
        ? `<span class="jira-lozenge ${viewedOddsClass}" title="${escapeHtmlText(`Target-Date Confidence: ${viewedFinishOdds}% of the 500 simulated project runs finish all issues on or before ${formatFriendlyDate(scrubbedDate, true)}.`)}">${viewedFinishOdds}% FINISH ODDS</span>`
        : '';
    const maxBucketProb = Math.max(0.05, ...activeSim.distributionBuckets.map((b) => b.probability));
    const reserves = activeSim.reserves;
    const baseTargetDays = reserves?.baseTargetDays ?? activeSim.p50Days;
    const pmBufferDays = reserves?.pmContingencyReserveDays ?? Math.max(0.5, activeSim.p85Days - activeSim.p50Days);
    const execReserveDays = reserves?.managementReserveDays ?? Math.max(0.5, activeSim.cvar95Days - activeSim.p85Days);
    const totalReserveSpan = Math.max(1, baseTargetDays + pmBufferDays + execReserveDays);
    const basePct = Math.max(20, Math.round((baseTargetDays / totalReserveSpan) * 100));
    const pmPct = Math.max(10, Math.round((pmBufferDays / totalReserveSpan) * 100));
    const execPct = Math.max(8, 100 - basePct - pmPct);
    const buckets = activeSim.distributionBuckets;
    const chartW = 380;
    const chartH = 128;
    const topPad = 20;
    const bottomPad = 22;
    const barAreaH = chartH - topPad - bottomPad; // 86px bar height area
    const colW = Math.floor((chartW - 16) / Math.max(1, buckets.length));
    const svgConeBars = buckets
        .map((b, idx, arr) => {
        const ratio = Math.max(0.08, b.probability / maxBucketProb);
        const barH = Math.max(5, Math.round(ratio * barAreaH));
        const x = 8 + idx * colW + 2;
        const y = topPad + (barAreaH - barH);
        const w = Math.max(8, colW - 5);
        const isNearP85 = Math.abs(b.dayOffset - activeSim.p85Days) <= 2.5;
        const isNearP50 = Math.abs(b.dayOffset - activeSim.p50Days) <= 2.5;
        const isNearScrub = Math.abs(b.dayOffset - scrubberDayOffset) <= 2;
        const fillCol = isNearP85
            ? '#0C66E4'
            : b.dayOffset <= activeSim.p50Days
                ? '#38BDF8'
                : b.dayOffset <= activeSim.p85Days
                    ? '#2563EB'
                    : '#6366F1';
        const strokeAttr = isNearScrub
            ? 'stroke="#0F172A" stroke-width="2"'
            : isNearP85
                ? 'stroke="#09326C" stroke-width="1.5"'
                : '';
        const pctVal = Math.round(b.probability * 100);
        const cumPctVal = Math.round(b.cumulativeProbability * 100);
        const showTopPct = pctVal >= 8 || isNearP85 || isNearP50;
        const topPctText = showTopPct
            ? `<text x="${x + w / 2}" y="${Math.max(12, y - 5)}" text-anchor="middle" fill="${isNearP85 ? '#0C66E4' : '#334155'}" font-size="10" font-weight="${isNearP85 ? '800' : '600'}">${pctVal}%</text>`
            : '';
        const showDateLabel = idx === 0 ||
            idx === Math.floor(arr.length * 0.33) ||
            idx === Math.floor(arr.length * 0.66) ||
            idx === arr.length - 1;
        const labelText = showDateLabel
            ? `<text x="${x + w / 2}" y="${chartH - 5}" text-anchor="middle" fill="#475569" font-size="10" font-weight="600">${escapeHtmlText(formatFriendlyDate(b.date))}</text>`
            : '';
        const hoverExplanation = `Finish Window: ${formatFriendlyDate(b.date, true)} | Window Likelihood: ${pctVal}% of the 500 simulated runs finished in this date window | Cumulative Confidence: ${cumPctVal}% chance of finishing on or before ${formatFriendlyDate(b.date)}`;
        return `
        <g class="hist-bar-group">
          <rect x="${x}" y="${y}" width="${w}" height="${barH}" rx="3" fill="${fillCol}" ${strokeAttr}>
            <title>${escapeHtmlText(hoverExplanation)}</title>
          </rect>
          ${topPctText}
          ${labelText}
        </g>
      `;
    })
        .join('');
    const baseP50Tooltip = `Core Work Estimate (${baseTargetDays.toFixed(1)} days, Likely Finish around ${formatFriendlyDate(activeSim.p50Date)}): Typical time needed to finish all planned Jira issues if work proceeds at a normal sprint pace without unexpected blockers (50% odds).`;
    const pmBufferTooltip = `Team Risk Buffer (+${pmBufferDays.toFixed(1)} days, Target Commit Date ${formatFriendlyDate(activeSim.p85Date)}): Extra schedule cushion managed by the Tech Lead / Project Manager for everyday sprint risks (code review wait times, QA bug fixes, minor scope changes). Raises on-time confidence from 50% to 85%.`;
    const execReserveTooltip = `Executive Contingency (+${execReserveDays.toFixed(1)} days, worst-case safe date ${formatFriendlyDate(activeSim.cvar95Date)}): Leadership reserve held for rare, severe disruptions (cross-team blocker cascades, architecture rework, or key-person bottlenecks) to protect the release in the worst 5% of scenarios.`;
    return `
    <section class="time-machine-panel">
      <!-- Top Full-Width Section: Header, 6-Milestone Stepper & Scrubber Slider -->
      <div class="tm-top-full">
        <div class="tm-header">
          <div class="tm-title">
            <span>Timeline &amp; Sprint Forecast Scrubber</span>
            ${renderInfoTooltip('Timeline & Sprint Forecast Scrubber', 'Click any of the 6 sprint milestones below or drag the timeline slider to preview which Jira issues are expected to be Done, In Progress, or At Risk on that date.', `Reference Date: ${graph.referenceDate} | Viewing Offset: ${scrubberDayOffset}d (${scrubbedDate})`)}
          </div>

          <div class="tm-header-right">
            <span class="tm-date-pill">
              Viewing: <strong>${formatFriendlyDate(scrubbedDate, true)}</strong>
              <span class="jira-lozenge jira-lozenge-todo">${relativeOffsetLabel}</span>
              ${viewedOddsHtml}
            </span>
            <div class="tm-status-summary">
              <span class="jira-lozenge jira-lozenge-done">${dynamicDone} DONE</span>
              <span class="jira-lozenge jira-lozenge-inprogress">${dynamicInProgress} IN PROGRESS</span>
              <span class="jira-lozenge ${dynamicAtRisk > 0 ? 'jira-lozenge-danger' : 'jira-lozenge-neutral'}">${dynamicAtRisk} AT RISK</span>
              <span class="jira-lozenge jira-lozenge-todo">${dynamicScheduled} TO DO</span>
            </div>
          </div>
        </div>

        <!-- Full-Width 6-Column Milestone Stepper Row (Zero Overlap) -->
        <div class="epoch-track-grid">
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
                  <div class="epoch-node-top-row">
                    <span class="jira-lozenge ${lozClass}">${escapeHtmlText(meta.badge)}</span>
                    <span class="epoch-date-str">${formatFriendlyDate(ep.date)}</span>
                  </div>
                  <span class="epoch-node-label">${escapeHtmlText(meta.title)}</span>
                </button>
              `;
    })
        .join('')}
        </div>

        <!-- Full-Width Scrubber Slider -->
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
      </div>

      <!-- Bottom 2-Column Split: Left = 3-Tier Schedule Buffer Breakdown | Right = Delivery Confidence Distribution -->
      <div class="tm-bottom-split-2col">
        <!-- Left Card: 3-Tier Schedule Buffer Breakdown -->
        <div class="buffer-breakdown-card">
          <div class="buffer-breakdown-header">
            <div class="buffer-breakdown-title">
              <span>3-Tier Schedule Buffer Breakdown</span>
              ${renderInfoTooltip('What are Core Work Estimate, Team Risk Buffer, and Executive Contingency?', '• Core Work Estimate (Likely Finish — 50% odds): Typical time to finish planned work if there are no major surprises (statistical 50th percentile). • Team Risk Buffer (Target Commit Date — 85% safe): Extra days managed by the Tech Lead / PM for normal engineering risks (code review delays, bug fixes, minor scope changes) to reach a safe commitment date (85th percentile). • Executive Contingency (Safe Buffer Date — 95%+ cutoff): Leadership reserve held for rare, severe disruptions (cross-team blocker cascades or architecture rework) in the worst 5% of scenarios.', `Core Work Estimate = ${baseTargetDays.toFixed(1)}d (${formatFriendlyDate(activeSim.p50Date)}) | Team Risk Buffer = +${pmBufferDays.toFixed(1)}d (${formatFriendlyDate(activeSim.p85Date)}) | Executive Contingency = +${execReserveDays.toFixed(1)}d (${formatFriendlyDate(activeSim.cvar95Date)})`)}
            </div>
            <span class="buffer-total-label">Total Horizon: <strong>${Math.round(totalReserveSpan)}d</strong></span>
          </div>

          <svg width="100%" height="10" class="reserve-svg-bar">
            <rect x="0%" y="0" width="${basePct}%" height="10" fill="#0C66E4">
              <title>${escapeHtmlText(baseP50Tooltip)}</title>
            </rect>
            <rect x="${basePct}%" y="0" width="${pmPct}%" height="10" fill="#E2B203">
              <title>${escapeHtmlText(pmBufferTooltip)}</title>
            </rect>
            <rect x="${basePct + pmPct}%" y="0" width="${execPct}%" height="10" fill="#6E5DC6">
              <title>${escapeHtmlText(execReserveTooltip)}</title>
            </rect>
          </svg>

          <div class="buffer-pills-grid">
            <div class="buffer-pill-item" title="${escapeHtmlText(baseP50Tooltip)}">
              <div class="buffer-pill-top">
                <span class="reserve-dot dot-blue"></span>
                <strong>Core Work Estimate (${Math.round(baseTargetDays)}d)</strong>
              </div>
              <span class="buffer-pill-desc">Likely Finish (${formatFriendlyDate(activeSim.p50Date)})</span>
            </div>

            <div class="buffer-pill-item" title="${escapeHtmlText(pmBufferTooltip)}">
              <div class="buffer-pill-top">
                <span class="reserve-dot dot-amber"></span>
                <strong>Team Risk Buffer (+${Math.round(pmBufferDays)}d)</strong>
              </div>
              <span class="buffer-pill-desc">Target Commit (${formatFriendlyDate(activeSim.p85Date)})</span>
            </div>

            <div class="buffer-pill-item" title="${escapeHtmlText(execReserveTooltip)}">
              <div class="buffer-pill-top">
                <span class="reserve-dot dot-purple"></span>
                <strong>Executive Contingency (+${Math.round(execReserveDays)}d)</strong>
              </div>
              <span class="buffer-pill-desc">Safe Buffer (${formatFriendlyDate(activeSim.cvar95Date)})</span>
            </div>
          </div>
        </div>

        <!-- Right Card: Large, High-Clarity Delivery Confidence Distribution Histogram -->
        <div class="cone-box-wrap">
          <div class="cone-box-header">
            <div class="cone-box-title">
              <span>Delivery Confidence Distribution</span>
              ${renderInfoTooltip('What is Delivery Confidence Distribution?', 'Shows when your project is most likely to finish across 500 Monte Carlo simulations. • Bar Height (Window Likelihood): The % of the 500 simulated runs that finished during that specific date window (taller bars = most likely finish dates). • Cumulative Confidence: The total probability of finishing ON OR BEFORE that date (e.g., Target Commit Date on ' +
        formatFriendlyDate(activeSim.p85Date) +
        ' has 85% confidence).', `Likely Finish (50% odds): ${formatFriendlyDate(activeSim.p50Date)} | Target Commit Date (85% safe): ${formatFriendlyDate(activeSim.p85Date)} | Safe Buffer Date (95% cutoff): ${formatFriendlyDate(activeSim.p95Date)}`)}
            </div>
            <span class="jira-lozenge jira-lozenge-todo">TARGET: ${escapeHtmlText(formatFriendlyDate(activeSim.p85Date))}</span>
          </div>

          <div class="cone-box-subtitle">
            Bar height = % of 500 simulations finishing in each date window · Hover bars for cumulative on-time confidence
          </div>

          <svg viewBox="0 0 ${chartW} ${chartH}" width="100%" height="${chartH}" class="cone-svg-chart">
            <line x1="8" y1="${topPad}" x2="${chartW - 8}" y2="${topPad}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3 3" />
            <line x1="8" y1="${topPad + Math.round(barAreaH / 2)}" x2="${chartW - 8}" y2="${topPad + Math.round(barAreaH / 2)}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3 3" />
            <line x1="8" y1="${topPad + barAreaH}" x2="${chartW - 8}" y2="${topPad + barAreaH}" stroke="#CBD5E1" stroke-width="1.2" />
            ${svgConeBars}
          </svg>

          <div class="cone-legend-footer">
            <span><i class="reserve-dot dot-sky"></i>Likely Finish (${formatFriendlyDate(activeSim.p50Date)})</span>
            <span><i class="reserve-dot dot-blue"></i>Target Commit Date (${formatFriendlyDate(activeSim.p85Date)})</span>
            <span><i class="reserve-dot dot-indigo"></i>Safe Buffer Date (${formatFriendlyDate(activeSim.p95Date)})</span>
          </div>
        </div>
      </div>
    </section>
  `;
}


// === Module: ui/components/DagCanvas ===
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
function resolveNodeShapeKind(node, topBlockerKey, topBlockerSet, isIntervenedOrigin, delayDays) {
    const isDiamondGate = Boolean(node.isStageGate) ||
        Boolean(node.confluenceDecision) ||
        node.issueType?.toLowerCase() === 'milestone' ||
        node.issueType?.toLowerCase() === 'gate';
    if (isDiamondGate)
        return 'gate';
    const isHexagonBlocker = node.key === topBlockerKey ||
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
function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) | 0;
    }
    return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}
function computeNodeCoordinates(graph) {
    const coords = {};
    const defaultColors = ['#0284C7', '#059669', '#7C3AED', '#D97706', '#DB2777', '#2563EB'];
    const usedTeamNames = Array.from(new Set(graph.nodes.map((n) => n.team)));
    const activeTeams = usedTeamNames.map((tName, idx) => {
        const found = graph.teams.find((t) => t.name === tName);
        return (found ?? {
            id: `team-${idx}`,
            name: tName,
            lead: 'Project Lead',
            color: tName === 'No Team Assigned'
                ? '#64748B'
                : defaultColors[idx % defaultColors.length],
        });
    });
    if (activeTeams.length === 0) {
        activeTeams.push({
            id: 'team-0',
            name: 'No Team Assigned',
            lead: 'Project Lead',
            color: '#64748B',
        });
    }
    const laneGroups = new Map();
    for (let l = 0; l < activeTeams.length; l++) {
        laneGroups.set(l, []);
    }
    graph.topologicalOrder.forEach((key) => {
        const node = graph.nodes.find((n) => n.key === key);
        if (!node)
            return;
        let laneIdx = activeTeams.findIndex((t) => t.name === node.team);
        if (laneIdx < 0) {
            laneIdx = 0;
        }
        laneGroups.get(laneIdx).push(key);
    });
    const laneCount = activeTeams.length;
    const laneHeight = laneCount === 1
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
        }
        else {
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
    }
    else {
        for (const [laneIdx, keys] of laneGroups.entries()) {
            if (keys.length > maxCols)
                maxCols = keys.length;
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
function renderDagCanvas(props) {
    const { graph, activeSim, selectedNodeKey, delayDays, addDeveloper, decoupleBlockingEdges, trimScope, scrubberDayOffset, } = props;
    const { coords, activeTeams, svgHeight, svgWidth, laneHeight, goalColX, } = computeNodeCoordinates(graph);
    const blastSet = new Set(activeSim.blastRadiusNodes);
    const criticalSet = new Set(activeSim.criticalPathNodes);
    const topBlockerKey = activeSim.topBottlenecks[0]?.key ?? '';
    const topBlockerSet = new Set(activeSim.topBottlenecks.slice(0, 3).map((b) => b.key));
    const hasActiveIntervention = delayDays !== 0 || addDeveloper || decoupleBlockingEdges || trimScope;
    const intervenedKey = hasActiveIntervention ? selectedNodeKey : '';
    const blockedByMap = new Map();
    const blocksMap = new Map();
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
            const rest = [];
            for (const w of words) {
                if (rest.length === 0 && ((acc + ' ' + w).trim().length <= 16 || acc.length === 0)) {
                    acc = (acc + ' ' + w).trim();
                }
                else {
                    rest.push(w);
                }
            }
            nameLine1 = acc;
            nameLine2 = rest.join(' ');
            if (nameLine2.length > 18) {
                nameLine2 = `${nameLine2.slice(0, 17)}…`;
            }
        }
        const leadDisplay = team.lead.length > 16 ? `${team.lead.slice(0, 15)}…` : team.lead;
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
          ${nameLine2
            ? `<text x="20" y="${yMid}" fill="#0F172A" font-size="12.5" font-weight="800">${escapeHtmlText(nameLine2)}</text>`
            : ''}

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
        if (!fromPos || !toPos)
            return '';
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
        return `<g><path d="${pathD}" class="${edgeClass}" marker-end="${markerId}"><title>${escapeHtmlText(edgeTooltip)}</title></path></g>`;
    })
        .join('');
    // Render Terminal Teamwork Graph Goal Capsules on the right edge + edges from rightmost lane nodes
    const goalsToRender = activeSim.goalImpacts.length > 0
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
    const rightmostByLane = new Map();
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
        const goalY = activeTeams.length === 1
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
        const pillFill = goal.status === 'Off Track'
            ? '#FFE4E6'
            : isMint
                ? '#6EE7B7'
                : '#6D28D9';
        const pillStroke = goal.status === 'Off Track'
            ? '#E11D48'
            : isMint
                ? '#059669'
                : '#4C1D95';
        const pillTextFill = goal.status === 'Off Track'
            ? '#881337'
            : isMint
                ? '#064E3B'
                : '#FFFFFF';
        const pillSubFill = goal.status === 'Off Track'
            ? '#9F1239'
            : isMint
                ? '#065F46'
                : '#DDD6FE';
        const shortGoalName = goal.goalName.length > 18
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
        // Sub-task / Epic completion metrics (Concept 1 node presentation)
        const totalSub = node.subtaskTotalCount ??
            Math.max(3, Math.min(8, Math.round(node.baseEstimateDays)));
        let doneSub = node.subtaskDoneCount ?? 0;
        let progPct = node.subtaskProgressPct ?? stat?.completionStepPct ?? 0;
        if (temporalState === 'Done') {
            doneSub = totalSub;
            progPct = 100;
        }
        else if (temporalState === 'In Progress' && progPct === 0) {
            doneSub = Math.max(1, Math.round(totalSub * 0.67));
            progPct = Math.round((doneSub / totalSub) * 100);
        }
        else if (temporalState === 'At Risk / Blocked' && progPct === 0) {
            doneSub = Math.max(1, Math.round(totalSub * 0.4));
            progPct = Math.round((doneSub / totalSub) * 100);
        }
        else if (doneSub === 0 && progPct > 0 && totalSub > 1) {
            doneSub = Math.min(totalSub - 1, Math.max(1, Math.round((progPct / 100) * totalSub)));
        }
        const avatarInitials = getInitials(node.assignee);
        const avatarBg = getAvatarColor(node.assignee);
        const rippleShift = stat?.rippleDelayDays ?? 0;
        const goalObj = graph.goals.find((g) => g.id === node.goalId);
        // Determine which of the 4 shapes this node takes:
        const shapeKind = resolveNodeShapeKind(node, topBlockerKey, topBlockerSet, isIntervenedOrigin, delayDays);
        const isDiamondGate = shapeKind === 'gate';
        const isHexagonBlocker = shapeKind === 'blocker';
        const shapeType = isDiamondGate
            ? 'Diamond Gate'
            : isHexagonBlocker
                ? 'Hexagon Blocker'
                : 'Circle Task/Epic';
        const blockedByKeys = blockedByMap.get(node.key) ?? [];
        const blocksKeys = blocksMap.get(node.key) ?? [];
        const hoverJson = JSON.stringify({
            key: node.key,
            summary: node.summary,
            team: node.team,
            assignee: node.assignee,
            status: `${temporalState} (${shapeType})`,
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
        // Top What-If intervention / slip badge
        let shiftBadge = '';
        if (isSelected && hasActiveIntervention) {
            const labelText = delayDays > 0
                ? `+${delayDays}d Delay`
                : delayDays < 0
                    ? `${delayDays}d Faster`
                    : addDeveloper
                        ? '+1 Dev'
                        : decoupleBlockingEdges
                            ? 'Decoupled'
                            : 'Scope MVP';
            shiftBadge = `
          <g transform="translate(0, -56)">
            <rect x="-34" y="0" width="68" height="16" rx="8" fill="#0C66E4" />
            <text x="0" y="11.5" text-anchor="middle" fill="#FFFFFF" font-size="9" font-weight="800">
              ${escapeHtmlText(labelText)}
            </text>
          </g>
        `;
        }
        else if (isInBlast && Math.abs(rippleShift) > 0) {
            const signText = rippleShift > 0
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
            const shortGateTitle = node.summary.length > 14
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
            ${isSelected
                ? `<polygon points="0,-54 54,0 0,54 -54,0" fill="none" stroke="#0C66E4" stroke-width="3" stroke-dasharray="4 3" />`
                : ''}
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
            const shortHexTitle = node.summary.length > 15
                ? `${node.summary.slice(0, 14)}…`
                : node.summary;
            const hexPerim = 248;
            const hexFilled = Math.max(28, Math.round((Math.max(15, progPct) / 100) * hexPerim));
            return `
          <g
            class="${groupClass}"
            data-node-key="${escapeHtmlText(node.key)}"
            data-node-x="${pos.x}"
            data-node-hover="${escapeHtmlText(hoverJson)}"
            transform="translate(${pos.x}, ${pos.y})"
          >
            ${isSelected
                ? `<polygon points="0,-54 47,-27 47,27 0,54 -47,27 -47,-27" fill="none" stroke="#0C66E4" stroke-width="3" />`
                : ''}
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
        const baseRingColor = temporalState === 'Done'
            ? '#10B981'
            : isSelected
                ? '#0C66E4'
                : isCritical
                    ? '#F59E0B'
                    : '#0284C7';
        const progressArcColor = temporalState === 'Done'
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
          ${isSelected || isHighRiskCircle
            ? `<circle r="50" fill="none" stroke="${isSelected ? '#0C66E4' : '#FB923C'}" stroke-width="2.5" opacity="0.65" />`
            : ''}
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
    const orderedJumpNodes = [];
    const seenKeys = new Set();
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
        const sKind = resolveNodeShapeKind(n, topBlockerKey, topBlockerSet, intervenedKey === n.key, delayDays);
        const shapeGlyph = sKind === 'gate' ? '◆' : sKind === 'blocker' ? '⬢' : '●';
        const shortSum = n.summary.length > 22 ? `${n.summary.slice(0, 21)}…` : n.summary;
        return `<option value="${escapeHtmlText(n.key)}" ${n.key === selectedNodeKey ? 'selected' : ''}>${shapeGlyph} ${escapeHtmlText(n.key)} · ${escapeHtmlText(shortSum)}</option>`;
    })
        .join('');
    return `
    <div class="panel-card dag-panel-card">
      <div class="panel-header">
        <div class="panel-title">
          <span class="stage-heading-title">Issue Dependency Map (${escapeHtmlText(graph.projectName)})</span>
          ${renderInfoTooltip('Issue Dependency Map & Jira Team Swimlanes', 'Swimlanes reflect real Jira Teams configured on your issues (via the Jira Team field or team:<Name> labels). If your Jira project has no teams configured, all issues are shown inside a single unified "No Team Assigned" swimlane without inventing fake teams. ● Circle = Task / Epic | ⬢ Hexagon = Critical Path Blocker | ◆ Diamond = Stage Gate | ▬ Pill = Teamwork Graph Goal.', `Active Swimlanes (${activeTeams.length}): ${activeTeams.map((t) => t.name).join(' · ')}`)}
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
    const { graph, selectedNodeKey, delayDays, addDeveloper, decoupleBlockingEdges, trimScope, activeSim, } = props;
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
    if (trimScope)
        modifiers.push('trimming non-essential scope to ship an MVP');
    const modSuffix = modifiers.length > 0 ? ` while ${modifiers.join(' and ')}` : '';
    return `@Rovo-World-Model Agent In project "${graph.projectName}" (${graph.projectKey}), simulate what happens to our "${goal?.name ?? 'Sprint Delivery'}" goal if issue ${node.key} ("${node.summary}") is ${shiftStr}${modSuffix}. Projected release date is ${activeSim.p85Date} with ${activeSim.blastRadiusNodes.length} impacted downstream issues. Recommend a concrete mitigation plan.`;
}
function renderTabBody(props) {
    const { activeRightTab, activeSim, intervention, graph, selectedNodeKey, delayDays, addDeveloper, decoupleBlockingEdges, trimScope, } = props;
    const hasActiveIntervention = delayDays !== 0 || addDeveloper || decoupleBlockingEdges || trimScope;
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
          <tr data-select-node="${escapeHtmlText(d.key)}" class="clickable-row" title="Click to inspect ${escapeHtmlText(d.key)} (${escapeHtmlText(d.summary)})">
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
          <div class="bottleneck-row-top">
            <span>
              <strong class="text-brand">#${idx + 1} ${escapeHtmlText(b.key)}</strong>
              — <strong class="bottleneck-summary-title">${escapeHtmlText(b.summary)}</strong>
            </span>
            <span class="jira-lozenge jira-lozenge-inprogress">GATES ${b.downstreamCount}</span>
          </div>
          <div class="bottleneck-row-meta">
            <span>Assignee: <strong>${escapeHtmlText(b.assignee)}</strong> · Risk Score: <strong>${b.riskScore}/100</strong></span>
            <span>Float: <strong>${(b.totalFloatDays ?? 0).toFixed(1)}d</strong> · <span title="Schedule Leverage: ~${(b.mitigationROI ?? 1.0).toFixed(1)} days of release risk saved per 1 day of mitigation effort">Impact: <strong class="text-success">~${(b.mitigationROI ?? 1.0).toFixed(1)}d saved/d</strong></span></span>
          </div>
          <div class="bottleneck-row-rec">
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
            <span>Core Work Estimate: <strong>${(res?.baseTargetDays ?? activeSim.p50Days).toFixed(1)}d</strong></span>
            <span>Team Risk Buffer: <strong>+${(res?.pmContingencyReserveDays ?? 0).toFixed(1)}d</strong></span>
          </div>
          <div class="gov-stat-row">
            <span>Executive Contingency: <strong>+${(res?.managementReserveDays ?? 0).toFixed(1)}d</strong></span>
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
    const selectedNode = graph.nodes.find((n) => n.key === selectedNodeKey) ?? graph.nodes[0];
    const selectedStat = activeSim.nodeStats[selectedNode.key];
    const matchedBottleneck = activeSim.topBottlenecks.find((b) => b.key === selectedNode.key);
    const downstreamCount = matchedBottleneck?.downstreamCount ??
        graph.edges.filter((e) => e.from === selectedNode.key).length;
    const critPct = Math.round((selectedStat?.criticalityIndex ?? 0) * 100);
    const primaryActionRec = selectedNode.baseEstimateDays <= 2
        ? `Task is small (${selectedNode.baseEstimateDays}d) — adding another developer would add handoff overhead. Best move: split or mock the dependency so downstream issues can start early.`
        : critPct >= 60
            ? `High-priority critical path issue (${critPct}% risk) blocking ${downstreamCount} downstream ${downstreamCount === 1 ? 'issue' : 'issues'}. Assign an extra developer to pair on ${selectedNode.key} and share early interface contracts.`
            : `Has ${Math.max(0, selectedStat?.slackDays ?? 0).toFixed(1)}d of schedule slack. Keep current owner (${selectedNode.assignee}) focused and avoid context-switching.`;
    return `
    <div class="gov-card-stack">
      <!-- Card 1: Concrete Recovery Action Plan for Selected Issue -->
      <div class="gov-card">
        <div class="gov-card-header">
          <span>1. Recommended Action Plan (${escapeHtmlText(selectedNode.key)})</span>
          <span class="jira-lozenge ${critPct >= 60 ? 'jira-lozenge-inprogress' : 'jira-lozenge-done'}">
            ${critPct >= 60 ? 'CRITICAL PATH' : 'ON TRACK'}
          </span>
        </div>
        <div class="gov-sub-note">
          💡 <strong>Triage Advice:</strong> ${escapeHtmlText(primaryActionRec)}
        </div>
        <div class="gov-stat-row">
          <span title="Estimated hours of downstream code/interface rework if this issue changes late">Rework Risk: <strong class="text-warning">~${activeSim.estimatedReworkHours} hrs</strong></span>
          <span title="Worst-case finish date across the 5% most delayed scenarios">Worst-Case Date: <strong class="text-danger">${formatFriendlyDate(activeSim.cvar95Date, true)}</strong></span>
        </div>
      </div>

      <!-- Card 2: Why Rovo & MCP Matter to Your Team -->
      <div class="gov-card">
        <div class="gov-card-header">
          <span>2. Connected AI Agents (Rovo &amp; IDE MCP)</span>
          <span class="jira-lozenge jira-lozenge-goal">${MCP_TOOLS_MANIFEST.length} LIVE TOOLS</span>
        </div>
        <div class="gov-sub-note">
          Allows <strong>Atlassian Rovo Chat</strong> and IDE coding agents (<strong>Cursor, Claude, VS Code</strong>) to query live Jira blockers and test schedule changes automatically:
        </div>
        <div class="gov-squad-list">
          <div class="gov-squad-row" title="MCP Tool: pwm_simulate_intervention | Rovo Action: simulate-delay-impact">
            <span><strong>Simulate Delay Impact</strong></span>
            <span class="text-brand">Tests +days, extra dev, or split links</span>
          </div>
          <div class="gov-squad-row" title="MCP Tool: pwm_get_critical_path | Rovo Action: analyze-critical-path">
            <span><strong>Find Top Blockers</strong></span>
            <span class="text-brand">Ranks #1–#3 sprint bottlenecks</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
function renderGoalsCard(activeSim) {
    return `
    <div class="panel-card goals-panel-card">
      <div class="panel-header">
        <div class="panel-title">
          <span>Teamwork Graph Goals</span>
          ${renderInfoTooltip('Teamwork Graph Goal Alignment', 'Tracks how issue schedule changes ripple up to linked Teamwork Graph Goals.')}
        </div>
        <span class="jira-lozenge jira-lozenge-goal">${activeSim.goalImpacts.length} GOALS</span>
      </div>
      <div class="goals-list-horizontal">
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
        const shiftClass = goal.rippleDelayDays > 0 ? 'text-danger' : 'text-success';
        return `
              <div class="goal-card ${statusClass}" title="Goal Key: ${escapeHtmlText(goal.goalKey)} | Owner: ${escapeHtmlText(goal.ownerTeam)}">
                <div class="goal-top">
                  <div>
                    <div class="goal-name">${escapeHtmlText(goal.goalName)}</div>
                    <div class="goal-owner-sub">
                      Owner: ${escapeHtmlText(goal.ownerTeam)}
                    </div>
                  </div>
                  ${renderJiraStatusLozenge(goal.status)}
                </div>
                <div class="goal-dates-row">
                  <span>Target: <strong>${formatFriendlyDate(goal.targetDate)}</strong></span>
                  <span>Projected: <strong>${formatFriendlyDate(goal.p85CompletionDate)}</strong> ${shiftSign ? `<em class="${shiftClass}">(${shiftSign})</em>` : ''}</span>
                  <span>On-Time: <strong>${probPct}%</strong></span>
                </div>
                <svg width="100%" height="6" class="prob-bar-svg">
                  <rect x="0" y="0" width="100%" height="6" rx="3" fill="#DCDFE4" />
                  <rect x="0" y="0" width="${Math.max(4, probPct)}%" height="6" rx="3" fill="${barColor}" />
                </svg>
              </div>
            `;
    })
        .join('')}
      </div>
    </div>
  `;
}
function renderScenarioPanel(props) {
    const { graph, baselineSim, activeSim, selectedNodeKey, delayDays, addDeveloper, decoupleBlockingEdges, trimScope, activeRightTab, copiedPromptNotice, } = props;
    const selectedNode = graph.nodes.find((n) => n.key === selectedNodeKey) ?? graph.nodes[0];
    const selectedStat = activeSim.nodeStats[selectedNode.key];
    const linkedGoal = graph.goals.find((g) => g.id === selectedNode.goalId) ?? graph.goals[0];
    const blockedByKeys = graph.edges
        .filter((e) => e.to === selectedNode.key)
        .map((e) => e.from);
    const blocksKeys = graph.edges
        .filter((e) => e.from === selectedNode.key)
        .map((e) => e.to);
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
            : addDeveloper || decoupleBlockingEdges || trimScope
                ? `<span class="jira-lozenge jira-lozenge-done">MITIGATED</span>`
                : `<span class="jira-lozenge jira-lozenge-todo">BASELINE</span>`;
    const uncertaintyLabel = selectedNode.uncertaintySigma >= 1.8
        ? 'High'
        : selectedNode.uncertaintySigma >= 1.0
            ? 'Medium'
            : 'Low';
    const getInitials = (name) => name
        .split(/\s+/)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')
        .slice(0, 2) || 'DEV';
    const assigneeInitials = getInitials(selectedNode.assignee);
    const doneSub = selectedNode.subtaskDoneCount ?? 0;
    const totalSub = selectedNode.subtaskTotalCount ?? 4;
    const progPct = selectedNode.subtaskProgressPct ??
        selectedStat?.completionStepPct ??
        (selectedNode.status === 'Done' ? 100 : selectedNode.status === 'In Progress' ? 50 : 0);
    const isTopBlocker = activeSim.topBottlenecks.slice(0, 3).some((b) => b.key === selectedNode.key) ||
        selectedNode.status.toLowerCase() === 'blocked' ||
        delayDays > 0;
    const isStageGate = Boolean(selectedNode.isStageGate) ||
        Boolean(selectedNode.confluenceDecision);
    const shapeTaxonomyBadge = isStageGate
        ? `<span class="shape-badge-diamond">◆ STAGE GATE</span>`
        : isTopBlocker
            ? `<span class="shape-badge-hex">⬢ BLOCKER</span>`
            : `<span class="shape-badge-circle">● TASK / EPIC</span>`;
    const progBarColor = progPct >= 100
        ? '#10B981'
        : isTopBlocker
            ? '#F59E0B'
            : '#0C66E4';
    const baseP50X = Math.max(24, Math.min(240, Math.round((baselineSim.p50Days / maxTimelineScale) * 260)));
    const simP85X = Math.max(36, Math.min(265, Math.round((activeSim.p85Days / maxTimelineScale) * 260)));
    const bellStroke = delayDays > 0 ? '#E11D48' : delayDays < 0 ? '#10B981' : '#4F46E5';
    const bellFill = delayDays > 0 ? '#FFE4E6' : delayDays < 0 ? '#D1FAE5' : '#E0E7FF';
    const forecastRows = [
        {
            label: 'Likely Finish (50% odds)',
            tooltip: 'Likely Delivery Date: 50% of simulated runs finish on or before this date (normal sprint pace without unexpected blockers).',
            baseDays: baselineSim.p50Days,
            intDays: activeSim.p50Days,
            baseDate: baselineSim.p50Date,
            intDate: activeSim.p50Date,
        },
        {
            label: 'Target Commit Date (85% safe)',
            tooltip: 'Recommended Target Commit Date: 85% probability of finishing on or before this date (includes Team Risk Buffer).',
            baseDays: baselineSim.p85Days,
            intDays: activeSim.p85Days,
            baseDate: baselineSim.p85Date,
            intDate: activeSim.p85Date,
        },
        {
            label: 'Safe Buffer Date (95% cutoff)',
            tooltip: `Safe Buffer Cutoff Date (95% confidence). Worst-case 5% blocker scenario finishes around ${formatFriendlyDate(activeSim.cvar95Date, true)}.`,
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
            ${renderInfoTooltip('What-If Scenario Simulator', 'Select any issue from your Jira project and test how a delay, acceleration, or resource change affects the overall delivery date and Teamwork Graph goals.', `Active Scenario: ${selectedNode.key} (${delayDays >= 0 ? `+${delayDays}d` : `${delayDays}d`})`)}
          </div>
          ${activeLozenge}
        </div>

        <div class="intervention-box">
          <!-- Selected Issue Card -->
          <div class="selected-node-banner">
            <div class="node-banner-top">
              <div class="node-banner-id-cluster">
                <span class="node-avatar-circle" title="Responsible Assignee: ${escapeHtmlText(selectedNode.assignee)}">${escapeHtmlText(assigneeInitials)}</span>
                <span class="node-key-tag">${escapeHtmlText(selectedNode.key)}</span>
                ${shapeTaxonomyBadge}
              </div>
              ${renderJiraStatusLozenge(selectedNode.status)}
            </div>
            <div class="node-summary-text">${escapeHtmlText(selectedNode.summary)}</div>
            <div class="node-subtask-bar-wrap" title="Overall Issue / Epic Sub-task Completion: ${doneSub}/${totalSub} Sub-tasks (${progPct}%)">
              <div class="node-subtask-bar-labels">
                <span>Sub-tasks / Epic Progress</span>
                <strong>${doneSub}/${totalSub} Done (${progPct}%)</strong>
              </div>
              <svg width="100%" height="6" class="subtask-bar-svg">
                <rect x="0" y="0" width="100%" height="6" rx="3" fill="#E2E8F0" />
                <rect x="0" y="0" width="${Math.max(4, progPct)}%" height="6" rx="3" fill="${progBarColor}" />
              </svg>
            </div>
            <div class="node-meta-grid">
              <div class="meta-cell">
                <span>Assignee</span>
                <strong>${escapeHtmlText(selectedNode.assignee)}</strong>
              </div>
              <div class="meta-cell">
                <span>Estimate</span>
                <strong>${selectedNode.baseEstimateDays} Days</strong>
              </div>
              <div class="meta-cell" title="Estimate Uncertainty: ±${selectedNode.uncertaintySigma} days of potential schedule variance">
                <span>Uncertainty ⓘ</span>
                <strong>${uncertaintyLabel}</strong>
              </div>
              <div class="meta-cell" title="Criticality Index: ${Math.round((selectedStat?.criticalityIndex ?? 0) * 100)}% of Monte Carlo runs place this issue on the critical path">
                <span>Criticality ⓘ</span>
                <strong>${Math.round((selectedStat?.criticalityIndex ?? 0) * 100)}%</strong>
              </div>
            </div>
            <div class="node-lineage-row">
              <div class="lineage-cell" title="${escapeHtmlText(blockedByKeys.length > 0 ? `Upstream blockers: ${blockedByKeys.join(', ')}` : 'Entry task with no upstream blockers')}">
                <span>Blocked by:</span>
                <strong>${escapeHtmlText(blockedByKeys.length > 0 ? blockedByKeys.join(', ') : 'None (Entry Task)')}</strong>
              </div>
              <div class="lineage-cell" title="${escapeHtmlText(blocksKeys.length > 0 ? `Downstream dependents: ${blocksKeys.join(', ')}` : 'Terminal task with no downstream dependents')}">
                <span>Blocks:</span>
                <strong>${escapeHtmlText(blocksKeys.length > 0 ? blocksKeys.join(', ') : 'None (Terminal Task)')}</strong>
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
                title="Assign 1 extra full-time developer to help finish this issue faster (automatically accounts for ramp-up and coordination time)"
              >
                ${addDeveloper ? '✓ Extra Dev Added' : '+ Assign Extra Developer'}
              </button>
              <button
                class="scope-toggle-btn ${decoupleBlockingEdges ? 'active' : ''}"
                id="btn-toggle-decouple-edge"
                title="Split or mock the blocking interface so downstream issues can start work in parallel without waiting for this issue to finish 100%"
              >
                ${decoupleBlockingEdges ? '✓ Split / Mocked' : '✂ Decouple Dependency'}
              </button>
              <button
                class="scope-toggle-btn ${trimScope ? 'active' : ''}"
                id="btn-toggle-trim-scope"
                title="Defer non-essential sub-tasks or stretch goals to the next sprint (-35% remaining work & -45% uncertainty) to protect the release date"
              >
                ${trimScope ? '✓ Scope Trimmed (MVP)' : '📦 Trim Scope (MVP)'}
              </button>
            </div>
            ${addDeveloper && activeSim.deliveryGovernance?.brooksLawDiagnostic
        ? `<div class="brooks-advisory-banner" title="Accounts for realistic developer onboarding and team sync time">
                     <span><strong>Team Ramp-Up Note:</strong> Net <strong>${activeSim.deliveryGovernance.brooksLawDiagnostic.netAccelerationDays >= 0
            ? `${activeSim.deliveryGovernance.brooksLawDiagnostic.netAccelerationDays}d saved`
            : `${Math.abs(activeSim.deliveryGovernance.brooksLawDiagnostic.netAccelerationDays)}d slower`}</strong> after ${activeSim.deliveryGovernance.brooksLawDiagnostic.onboardingPenaltyDays}d of ramp-up &amp; handoff sync</span>
                   </div>`
        : ''}
          </div>

          <!-- Step 2: Release Date Comparison Bars -->
          <div class="comparison-bars-card">
            <div class="comparison-card-header">
              <span>Projected Release Impact</span>
              ${renderInfoTooltip('Baseline vs. Simulated Forecast', `Compares your baseline schedule against the simulated What-If change across 500 paired runs. Worst-case 5% blocker scenario finishes around ${formatFriendlyDate(activeSim.cvar95Date, true)}.`, `Release Shift: ${(activeSim.p85Days - baselineSim.p85Days).toFixed(1)}d | Worst-Case Date: ${activeSim.cvar95Date}`)}
            </div>

            <div class="mc-bell-curve-wrap" title="500-Run Monte Carlo Release Probability Curve (Likely Finish / Target Commit Date / Safe Buffer Date)">
              <svg width="100%" height="52" viewBox="0 0 280 52" class="mc-bell-svg">
                <path d="M 8 48 C 60 48, ${Math.max(40, simP85X - 45)} 8, ${simP85X - 14} 8 C ${simP85X + 18} 8, 235 48, 272 48 Z" fill="${bellFill}" />
                <path d="M 8 48 C 60 48, ${Math.max(40, simP85X - 45)} 8, ${simP85X - 14} 8 C ${simP85X + 18} 8, 235 48, 272 48" fill="none" stroke="${bellStroke}" stroke-width="2" />
                <line x1="${baseP50X}" y1="8" x2="${baseP50X}" y2="48" stroke="#64748B" stroke-width="1.3" stroke-dasharray="3 2" />
                <line x1="${simP85X}" y1="5" x2="${simP85X}" y2="48" stroke="${bellStroke}" stroke-width="2" />
                <rect x="8" y="3" width="104" height="16" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2" />
                <text x="60" y="14" text-anchor="middle" fill="${bellStroke}" font-size="9.5" font-weight="700">Target: ${escapeHtmlText(formatFriendlyDate(activeSim.p85Date))}</text>
              </svg>
            </div>

            ${forecastRows
        .map((row) => {
        const diff = Number((row.intDays - row.baseDays).toFixed(1));
        const intBarColor = diff > 0 ? '#CA3521' : diff < 0 ? '#1F845A' : '#0C66E4';
        const diffBadge = diff > 0
            ? `<span class="text-danger">(+${diff}d)</span>`
            : diff < 0
                ? `<span class="text-success">(${diff}d)</span>`
                : `<span class="text-muted">(0d)</span>`;
        return `
                  <div class="dist-compare-group" title="${escapeHtmlText(row.tooltip)}">
                    <div class="dist-compare-label">
                      <strong>${escapeHtmlText(row.label)}</strong>
                      <span>
                        ${formatFriendlyDate(row.baseDate)} → <strong>${formatFriendlyDate(row.intDate)}</strong> ${diffBadge}
                      </span>
                    </div>
                    <svg width="100%" height="14" class="dual-bar-svg">
                      <rect x="0" y="0" width="100%" height="6" rx="3" fill="#DCDFE4" />
                      <rect x="0" y="0" width="${pct(row.baseDays)}%" height="6" rx="3" fill="#8590A2" />
                      <rect x="0" y="8" width="100%" height="6" rx="3" fill="#DCDFE4" />
                      <rect x="0" y="8" width="${pct(row.intDays)}%" height="6" rx="3" fill="${intBarColor}" />
                    </svg>
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
            AI Action Plan
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
            ownerTeam: 'No Team Assigned',
            status: 'On Track',
        },
        {
            id: 'GOAL-OMEGA',
            key: `${projectKey}-GOAL-2`,
            name: `${projectName} Release Milestone`,
            targetDate: '2026-12-02',
            targetDayOffset: 32,
            ownerTeam: 'No Team Assigned',
            status: 'On Track',
        },
    ], [], '2026-10-30');
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
    trimScope: false,
    selectedEpochIndex: 2, // Today
    scrubberDayOffset: 0,
    activeRightTab: 'cascade',
    copiedPromptNotice: false,
    statusBanner: 'Connected to Jira project — Click any issue card or drag the Schedule Change slider to simulate timeline impacts.',
};
function recomputeSimulation() {
    state.baselineSim = runMonteCarloSimulation(state.graph, { iterations: 500 });
    const hasIntervention = state.delayDays !== 0 ||
        state.addDeveloper ||
        state.decoupleBlockingEdges ||
        state.trimScope;
    if (hasIntervention && state.selectedNodeKey) {
        const intResult = runIntervention(state.graph, state.selectedNodeKey, state.delayDays, {
            iterations: 500,
            addDeveloper: state.addDeveloper,
            decoupleBlockingEdges: state.decoupleBlockingEdges,
            trimScope: state.trimScope,
        });
        state.intervention = intResult;
        state.activeSim = intResult;
    }
    else {
        state.intervention = null;
        state.activeSim = state.baselineSim;
    }
}
function triggerRemoteWhatIf() {
    void invokeForgeResolver('runWhatIfSimulation', {
        projectKey: state.graph.projectKey,
        targetNodeId: state.selectedNodeKey,
        deltaDays: state.delayDays,
        addDeveloper: state.addDeveloper,
        decoupleBlockingEdges: state.decoupleBlockingEdges,
        trimScope: state.trimScope,
    });
}
function scrollDagToSelectedNode(smooth = true) {
    const viewport = document.getElementById('dag-viewport-container');
    if (!viewport)
        return;
    const selectedEl = viewport.querySelector(`.dag-node-group[data-node-key="${state.selectedNodeKey}"]`);
    if (!selectedEl)
        return;
    const nodeX = Number(selectedEl.getAttribute('data-node-x') ?? 0);
    const targetLeft = Math.max(0, nodeX - viewport.clientWidth / 2 + 100);
    if (typeof viewport.scrollTo === 'function') {
        viewport.scrollTo({
            left: targetLeft,
            behavior: smooth ? 'smooth' : 'auto',
        });
    }
    else {
        viewport.scrollLeft = targetLeft;
    }
}
function renderCockpit(activeSliderId) {
    const root = document.getElementById('app-root');
    if (!root)
        return;
    const dagViewport = document.getElementById('dag-viewport-container');
    const prevDagScrollLeft = dagViewport?.scrollLeft ?? 0;
    const prevDagScrollTop = dagViewport?.scrollTop ?? 0;
    const hasActiveIntervention = state.delayDays !== 0 ||
        state.addDeveloper ||
        state.decoupleBlockingEdges ||
        state.trimScope;
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
        statusBanner: state.statusBanner,
    };
    const headerHtml = renderTopAppBar(headerProps);
    const leftRailHtml = renderLeftStatusRail(headerProps);
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
        trimScope: state.trimScope,
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
        trimScope: state.trimScope,
        activeRightTab: state.activeRightTab,
        copiedPromptNotice: state.copiedPromptNotice,
    });
    const headerMount = document.getElementById('header-mount');
    const leftRailMount = document.getElementById('left-rail-mount');
    const scrubberMount = document.getElementById('scrubber-mount');
    const dagMount = document.getElementById('dag-mount');
    const scenarioMount = document.getElementById('scenario-mount');
    if (activeSliderId &&
        headerMount &&
        leftRailMount &&
        scrubberMount &&
        dagMount &&
        scenarioMount) {
        headerMount.innerHTML = headerHtml;
        leftRailMount.innerHTML = leftRailHtml;
        dagMount.innerHTML = dagHtml;
        const nextViewport = document.getElementById('dag-viewport-container');
        if (nextViewport) {
            nextViewport.scrollLeft = prevDagScrollLeft;
            nextViewport.scrollTop = prevDagScrollTop;
        }
        if (activeSliderId === 'delay-slider-input') {
            scrubberMount.innerHTML = scrubberHtml;
            const readoutEl = scenarioMount.querySelector('.slider-readout');
            if (readoutEl) {
                readoutEl.textContent =
                    state.delayDays > 0
                        ? `+${state.delayDays} Days Delay`
                        : state.delayDays < 0
                            ? `${state.delayDays} Days Faster`
                            : '0 Days (Baseline)';
                readoutEl.className = `slider-readout ${state.delayDays < 0
                    ? 'accel-text'
                    : state.delayDays === 0
                        ? 'neutral-text'
                        : ''}`;
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
      <div id="header-mount" class="mount-contents">${headerHtml}</div>
      <section class="workspace-grid-3col">
        <div id="left-rail-mount" class="mount-contents">${leftRailHtml}</div>
        <div class="center-stage-column">
          <div id="dag-mount" class="mount-contents">${dagHtml}</div>
          <div id="scrubber-mount" class="mount-contents">${scrubberHtml}</div>
        </div>
        <div id="scenario-mount" class="mount-contents">${scenarioHtml}</div>
      </section>
    </div>
  `;
    const restoredViewport = document.getElementById('dag-viewport-container');
    if (restoredViewport) {
        if (prevDagScrollLeft > 0)
            restoredViewport.scrollLeft = prevDagScrollLeft;
        if (prevDagScrollTop > 0)
            restoredViewport.scrollTop = prevDagScrollTop;
    }
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
        state.trimScope = false;
        recomputeSimulation();
        state.statusBanner = `Loaded live Jira project "${state.graph.projectName}" (${state.graph.projectKey}) with ${state.graph.nodes.length} ${state.graph.nodes.length === 1 ? 'issue' : 'issues'}.`;
        renderCockpit();
    }
    else if (projectKey) {
        const matched = state.availableProjects.find((p) => p.key === projectKey);
        state.graph = createInitialRealProjectGraph(projectKey, matched?.name ?? `${projectKey} Project`);
        state.selectedNodeKey = state.graph.nodes[0]?.key ?? `${projectKey}-1`;
        state.delayDays = 0;
        state.addDeveloper = false;
        state.decoupleBlockingEdges = false;
        state.trimScope = false;
        recomputeSimulation();
        renderCockpit();
    }
}
function attachCockpitEventListeners(skipMountForSlider) {
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
    const issueJumpSelect = document.getElementById('dag-issue-jump-select');
    if (issueJumpSelect) {
        issueJumpSelect.addEventListener('change', () => {
            const nextKey = issueJumpSelect.value;
            if (nextKey) {
                state.selectedNodeKey = nextKey;
                state.copiedPromptNotice = false;
                recomputeSimulation();
                triggerRemoteWhatIf();
                renderCockpit();
                scrollDagToSelectedNode(true);
            }
        });
    }
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
        el.addEventListener('mouseenter', () => {
            if (!hoverCard)
                return;
            const rawHover = el.getAttribute('data-node-hover');
            if (!rawHover)
                return;
            try {
                const info = JSON.parse(rawHover);
                const blockedByStr = info.blockedByKeys && info.blockedByKeys.length > 0
                    ? info.blockedByKeys.join(', ')
                    : 'None';
                const blocksStr = info.blocksKeys && info.blocksKeys.length > 0
                    ? info.blocksKeys.join(', ')
                    : 'None';
                const shiftLine = info.rippleShift > 0
                    ? `<strong class="text-danger">+${info.rippleShift.toFixed(1)}d downstream slip</strong>`
                    : info.rippleShift < 0
                        ? `<strong class="text-success">${info.rippleShift.toFixed(1)}d faster</strong>`
                        : `<span class="text-muted">On Baseline Schedule</span>`;
                const floatDays = info.totalFloatDays ?? 0;
                const floatBadge = floatDays < 0
                    ? `<strong class="text-danger">${floatDays.toFixed(1)}d (Super-Critical)</strong>`
                    : floatDays === 0
                        ? `<strong class="text-warning">0.0d (Critical Path)</strong>`
                        : `<strong class="text-success">+${floatDays.toFixed(1)}d Slack</strong>`;
                const stepPct = info.completionStepPct ?? 0;
                const stepLabel = info.subtaskLabel ??
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
          ${info.adr
                    ? `<div class="hover-card-adr">📄 ${escapeHtmlText(info.adr)}</div>`
                    : ''}
          <div class="hover-card-math">
            📐 <code>Expected: ${(info.pertMean ?? info.estimateDays).toFixed(1)}d (±${(info.pertSigma ?? info.sigma).toFixed(1)}d) | Critical Path Risk: ${info.criticalityPct}%</code>
          </div>
          <div class="hover-card-tip">Click issue card to select &amp; simulate</div>
        `;
                hoverCard.classList.add('is-visible');
            }
            catch {
                // Ignore parse issues
            }
        });
        el.addEventListener('mouseleave', () => {
            if (hoverCard) {
                hoverCard.classList.remove('is-visible');
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
        // 5b. Scope Toggle: Trim / Defer Scope (MVP)
        const btnTrimScope = document.getElementById('btn-toggle-trim-scope');
        if (btnTrimScope) {
            btnTrimScope.addEventListener('click', () => {
                state.trimScope = !state.trimScope;
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
                    trimScope: state.trimScope,
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
                    state.copiedPromptNotice = false;
                    recomputeSimulation();
                    triggerRemoteWhatIf();
                    renderCockpit();
                    scrollDagToSelectedNode(true);
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
// Global [ and ] keyboard stepping across issues in the Dependency Map (attached once)
document.addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey)
        return;
    const activeEl = document.activeElement;
    const tag = activeEl?.tagName?.toUpperCase();
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || activeEl?.isContentEditable) {
        return;
    }
    if (event.key !== '[' && event.key !== ']')
        return;
    const order = state.graph.topologicalOrder.length > 0
        ? state.graph.topologicalOrder
        : state.graph.nodes.map((n) => n.key);
    if (order.length === 0)
        return;
    const curIdx = order.indexOf(state.selectedNodeKey);
    const step = event.key === '[' ? -1 : 1;
    const nextIdx = curIdx < 0 ? 0 : (curIdx + step + order.length) % order.length;
    const nextKey = order[nextIdx];
    if (!nextKey || nextKey === state.selectedNodeKey)
        return;
    state.selectedNodeKey = nextKey;
    state.copiedPromptNotice = false;
    recomputeSimulation();
    triggerRemoteWhatIf();
    renderCockpit();
    scrollDagToSelectedNode(true);
});
// Initialize on DOM load + sync with Forge Backend Resolver (`getGraphData`)
document.addEventListener('DOMContentLoaded', async () => {
    renderCockpit();
    await loadJiraProjectGraph();
});

})();
