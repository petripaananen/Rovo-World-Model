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

import {
  CausalEdge,
  CausalGraph,
  CausalNode,
  RawJiraIssue,
  TeamMetadata,
  TeamworkGoal,
} from './types';

export interface CycleResolutionResult {
  acyclicEdges: CausalEdge[];
  cycleWarnings: string[];
}

export interface DeterministicScheduleNode {
  key: string;
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slackDays: number;
  /** Signed float relative to target deadline (negative when behind target / super-critical) */
  totalFloatDays: number;
  downstreamCount: number;
  downstreamRippleWeight: number;
  isOnCriticalPath: boolean;
}

/**
 * Computes 3-Point PERT Beta expected duration (mean M) and standard deviation (sigma)
 * when `optimisticDays` (Min), `mostLikelyDays` (ML), and `pessimisticDays` (Max) are present.
 * Formula: M = (Min + 4 * ML + Max) / 6, Sigma = (Max - Min) / 6.
 */
export function computePertParameters(node: CausalNode): {
  meanDays: number;
  sigmaDays: number;
  isPertActive: boolean;
} {
  const hasPert =
    typeof node.optimisticDays === 'number' &&
    typeof node.mostLikelyDays === 'number' &&
    typeof node.pessimisticDays === 'number' &&
    node.pessimisticDays >= node.optimisticDays;

  if (hasPert) {
    const minD = Math.max(0.25, node.optimisticDays!);
    const mlD = Math.max(minD, node.mostLikelyDays!);
    const maxD = Math.max(mlD, node.pessimisticDays!);
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
export function resolveNodeKey(nodes: CausalNode[], identifier: string): string | undefined {
  const normalized = identifier.trim().toUpperCase();
  const exact = nodes.find(
    (n) => n.key.toUpperCase() === normalized || n.id.toUpperCase() === normalized
  );
  if (exact) return exact.key;

  // Fallback: match by numeric suffix (e.g., CORE-104 matches CHRON-104)
  const suffixMatch = normalized.match(/-(\d+)$/);
  if (suffixMatch) {
    const suffix = `-${suffixMatch[1]}`;
    const bySuffix = nodes.find((n) => n.key.toUpperCase().endsWith(suffix));
    if (bySuffix) return bySuffix.key;
  }

  return undefined;
}

/**
 * Detects directed cycles using three-color Depth-First Search (DFS) and
 * automatically breaks cycles by removing cycle-closing back-edges.
 * Logs descriptive warnings so dirty Jira link data never crashes the engine.
 */
export function detectAndBreakCycles(
  nodes: CausalNode[],
  rawEdges: CausalEdge[]
): CycleResolutionResult {
  const exactKeyMap = new Map<string, string>();
  for (const node of nodes) {
    exactKeyMap.set(node.key.trim().toUpperCase(), node.key);
    exactKeyMap.set(node.id.trim().toUpperCase(), node.key);
  }
  const cycleWarnings: string[] = [];

  // 1. Normalize & deduplicate edges, dropping self-loops and cross-project / dangling references
  //    (use exact key/id match rather than numeric suffix fallback so e.g. EXT-4 never aliases BLP-4).
  const edgeMap = new Map<string, CausalEdge>();
  for (const edge of rawEdges) {
    const fromKey = exactKeyMap.get(edge.from.trim().toUpperCase());
    const toKey = exactKeyMap.get(edge.to.trim().toUpperCase());

    if (!fromKey || !toKey) {
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
  const adjacency = new Map<string, CausalEdge[]>();
  for (const node of nodes) {
    adjacency.set(node.key, []);
  }
  for (const edge of edgeMap.values()) {
    adjacency.get(edge.from)?.push(edge);
  }

  // Three-color DFS state: 0 = UNVISITED, 1 = VISITING (in active recursion stack), 2 = VISITED
  const color = new Map<string, 0 | 1 | 2>();
  const parentInStack = new Map<string, string>();
  const removedPairKeys = new Set<string>();

  for (const node of nodes) {
    color.set(node.key, 0);
  }

  const reconstructCyclePath = (fromKey: string, toKey: string): string => {
    const chain: string[] = [toKey, fromKey];
    let cursor: string | undefined = fromKey;
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

  const dfs = (u: string): void => {
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
      } else if (vColor === 0) {
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

  const acyclicEdges: CausalEdge[] = [];
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
export function topologicalSort(nodes: CausalNode[], edges: CausalEdge[]): string[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  const nodeIndex = new Map<string, number>();

  nodes.forEach((node, idx) => {
    inDegree.set(node.key, 0);
    adj.set(node.key, []);
    nodeIndex.set(node.key, idx);
  });

  for (const edge of edges) {
    if (inDegree.has(edge.from) && inDegree.has(edge.to)) {
      adj.get(edge.from)!.push(edge.to);
      inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
    }
  }

  // Ready queue sorted deterministically by original node index
  const queue: string[] = [];
  for (const node of nodes) {
    if ((inDegree.get(node.key) ?? 0) === 0) {
      queue.push(node.key);
    }
  }
  queue.sort((a, b) => (nodeIndex.get(a) ?? 0) - (nodeIndex.get(b) ?? 0));

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
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
export function buildCausalDAG(params: {
  projectKey: string;
  projectName: string;
  referenceDate?: string;
  source: 'jira-live' | 'synthetic-seed';
  isSyntheticDemo?: boolean;
  nodes: CausalNode[];
  edges: CausalEdge[];
  goals: TeamworkGoal[];
  teams: TeamMetadata[];
}): CausalGraph {
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
export function getDownstreamBlastRadius(
  graph: CausalGraph,
  targetNodeId: string
): {
  targetKey: string | undefined;
  blastRadiusKeys: string[];
  effectiveWeights: Record<string, number>;
} {
  const targetKey = resolveNodeKey(graph.nodes, targetNodeId);
  if (!targetKey) {
    return { targetKey: undefined, blastRadiusKeys: [], effectiveWeights: {} };
  }

  const outgoing = new Map<string, CausalEdge[]>();
  for (const node of graph.nodes) {
    outgoing.set(node.key, []);
  }
  for (const edge of graph.edges) {
    outgoing.get(edge.from)?.push(edge);
  }

  const effectiveWeights: Record<string, number> = {
    [targetKey]: 1.0,
  };

  // Traverse in topological order starting from targetKey
  const topo =
    graph.topologicalOrder.length === graph.nodes.length
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

  const blastRadiusKeys = topo.filter(
    (k) => k !== targetKey && (effectiveWeights[k] ?? 0) > 0
  );

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
export function computeDeterministicCriticalPath(
  graph: CausalGraph,
  forcedTargetDays?: number
): Record<string, DeterministicScheduleNode> {
  const topo =
    graph.topologicalOrder.length === graph.nodes.length
      ? graph.topologicalOrder
      : topologicalSort(graph.nodes, graph.edges);

  const nodeMap = new Map<string, CausalNode>(graph.nodes.map((n) => [n.key, n]));
  const incoming = new Map<string, CausalEdge[]>();
  const outgoing = new Map<string, CausalEdge[]>();

  for (const node of graph.nodes) {
    incoming.set(node.key, []);
    outgoing.set(node.key, []);
  }
  for (const edge of graph.edges) {
    incoming.get(edge.to)?.push(edge);
    outgoing.get(edge.from)?.push(edge);
  }

  const effectiveDuration = (node: CausalNode): number => {
    if (node.status.toLowerCase() === 'done') {
      return 0;
    }
    const pert = computePertParameters(node);
    return Math.max(0.5, pert.meanDays);
  };

  // Forward pass supporting FS, SS, FF, SF precedence and lagDays
  const ES = new Map<string, number>();
  const EF = new Map<string, number>();

  for (const key of topo) {
    const node = nodeMap.get(key)!;
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
      } else if (pType === 'FF') {
        candidateStart = Math.max(0, predEF + lag - dur);
      } else if (pType === 'SF') {
        candidateStart = Math.max(0, predES + lag - dur);
      } else {
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
  const goalOffsetById = new Map<string, number>();
  for (const g of graph.goals) {
    if (g.targetDayOffset > 0) {
      goalOffsetById.set(g.id, g.targetDayOffset);
    }
  }
  const earliestGoalOffset =
    graph.goals.length > 0
      ? Math.min(...graph.goals.map((g) => g.targetDayOffset).filter((d) => d > 0), projectDuration)
      : projectDuration;
  const targetDeadlineDays =
    typeof forcedTargetDays === 'number' && Number.isFinite(forcedTargetDays)
      ? forcedTargetDays
      : earliestGoalOffset > 0
        ? earliestGoalOffset
        : projectDuration;

  // Backward pass + transitive downstream count
  const LS = new Map<string, number>();
  const LF = new Map<string, number>();
  const forcedLS = new Map<string, number>();
  const downstreamSets = new Map<string, Set<string>>();

  for (let i = topo.length - 1; i >= 0; i--) {
    const key = topo[i];
    const node = nodeMap.get(key)!;
    const dur = effectiveDuration(node);
    const succs = outgoing.get(key) ?? [];
    const ds = new Set<string>();
    const nodeGoalDeadline =
      typeof forcedTargetDays === 'number' && Number.isFinite(forcedTargetDays)
        ? forcedTargetDays
        : goalOffsetById.get(node.goalId) ?? targetDeadlineDays;

    if (succs.length === 0) {
      LF.set(key, projectDuration);
      LS.set(key, Math.max(0, projectDuration - dur));
      forcedLS.set(key, nodeGoalDeadline - dur);
    } else {
      let minLatestStart = Math.max(0, projectDuration - dur);
      let minLatestFinish = projectDuration;
      let minForcedStart = nodeGoalDeadline - dur;

      for (const edge of succs) {
        ds.add(edge.to);
        const childDs = downstreamSets.get(edge.to);
        if (childDs) {
          for (const item of childDs) {
            ds.add(item);
          }
        }
        const pType = edge.precedenceType ?? 'FS';
        const lag = edge.lagDays ?? 0;
        const succLS = LS.get(edge.to) ?? projectDuration;
        const succLF = LF.get(edge.to) ?? projectDuration;
        const succForcedLS = forcedLS.get(edge.to) ?? targetDeadlineDays;
        const succNodeDur = effectiveDuration(nodeMap.get(edge.to)!);
        const succForcedLF = succForcedLS + succNodeDur;

        let edgeMaxLS = minLatestStart;
        let edgeForcedMaxLS = minForcedStart;

        if (pType === 'SS') {
          edgeMaxLS = Math.max(0, succLS - lag);
          edgeForcedMaxLS = succForcedLS - lag;
        } else if (pType === 'FF') {
          const maxLF = Math.min(projectDuration, succLF - lag);
          edgeMaxLS = Math.max(0, maxLF - dur);
          edgeForcedMaxLS = succForcedLF - lag - dur;
        } else if (pType === 'SF') {
          edgeMaxLS = Math.max(0, succLF - lag);
          edgeForcedMaxLS = succForcedLF - lag;
        } else {
          // Default FS (Finish-to-Start)
          const effectiveConstraint =
            edge.propagationWeight > 0 ? (succLS - lag) / edge.propagationWeight : succLS - lag;
          const boundedConstraint = Math.min(projectDuration, effectiveConstraint);
          edgeMaxLS = Math.max(0, boundedConstraint - dur);
          edgeForcedMaxLS = succForcedLS - lag - dur;
        }

        if (edgeMaxLS < minLatestStart) {
          minLatestStart = edgeMaxLS;
          minLatestFinish = Math.min(projectDuration, minLatestStart + dur);
        }
        if (edgeForcedMaxLS < minForcedStart) {
          minForcedStart = edgeForcedMaxLS;
        }
      }
      LS.set(key, minLatestStart);
      LF.set(key, minLatestFinish);
      forcedLS.set(key, minForcedStart);
    }
    downstreamSets.set(key, ds);
  }

  const result: Record<string, DeterministicScheduleNode> = {};
  for (const key of topo) {
    const es = Number((ES.get(key) ?? 0).toFixed(2));
    const ef = Number((EF.get(key) ?? 0).toFixed(2));
    const ls = Number((LS.get(key) ?? 0).toFixed(2));
    const lf = Number((LF.get(key) ?? 0).toFixed(2));
    const slackDays = Number(Math.max(0, ls - es).toFixed(2));
    const fLS = forcedLS.get(key) ?? ls;
    const totalFloatDays = Number((fLS - es).toFixed(2));
    const node = nodeMap.get(key)!;
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
export function buildDAGFromJiraIssues(
  projectKey: string,
  rawIssues: RawJiraIssue[],
  goals: TeamworkGoal[] = [],
  teams: TeamMetadata[] = [],
  referenceDate?: string
): CausalGraph {
  const defaultTeams: TeamMetadata[] =
    teams.length > 0
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

  const defaultGoals: TeamworkGoal[] =
    goals.length > 0
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

  const nodes: CausalNode[] = [];
  const rawEdges: CausalEdge[] = [];

  // Map Epic / parent keys to their child issues in the same project
  const childrenByParentKey = new Map<string, RawJiraIssue[]>();
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
    const estimateSeconds =
      issue.fields.timetracking?.remainingEstimateSeconds ??
      issue.fields.timetracking?.originalEstimateSeconds ??
      issue.fields.timeestimate ??
      issue.fields.timeoriginalestimate ??
      null;

    let baseEstimateDays = 5;
    if (typeof estimateSeconds === 'number' && estimateSeconds > 0) {
      baseEstimateDays = Math.max(1, Math.round(estimateSeconds / (8 * 3600)));
    } else if (typeof storyPoints === 'number' && storyPoints > 0) {
      baseEstimateDays = Math.max(1, Math.round(storyPoints * 1.25));
    } else {
      const issueType = (issue.fields.issuetype?.name ?? 'Task').toLowerCase();
      baseEstimateDays = issueType === 'epic' ? 8 : issueType === 'bug' ? 3 : 5;
    }

    const statusLower = statusName.toLowerCase();
    let uncertaintySigma = 1.5;
    if (statusLower === 'done' || statusLower === 'closed' || statusLower === 'resolved') {
      uncertaintySigma = 0.2;
    } else if (statusLower.includes('block')) {
      uncertaintySigma = Math.max(2.2, Number((baseEstimateDays * 0.45).toFixed(2)));
    } else if (statusLower.includes('progress')) {
      uncertaintySigma = Math.max(1.1, Number((baseEstimateDays * 0.28).toFixed(2)));
    } else {
      uncertaintySigma = Math.max(1.4, Number((baseEstimateDays * 0.35).toFixed(2)));
    }

    const labels = issue.fields.labels ?? [];
    const teamLabel = labels.find((l) => l.toLowerCase().startsWith('team:'));
    const goalLabel = labels.find((l) => l.toLowerCase().startsWith('goal:'));
    const pertLabel = labels.find((l) => l.toLowerCase().startsWith('pert:'));

    let optimisticDays: number | undefined;
    let mostLikelyDays: number | undefined;
    let pessimisticDays: number | undefined;

    if (pertLabel) {
      const parts = pertLabel
        .slice(5)
        .split('-')
        .map((v) => Number(v.trim()));
      if (parts.length === 3 && parts.every((n) => Number.isFinite(n) && n > 0)) {
        optimisticDays = parts[0];
        mostLikelyDays = parts[1];
        pessimisticDays = parts[2];
        baseEstimateDays = Number(
          ((optimisticDays + 4 * mostLikelyDays + pessimisticDays) / 6).toFixed(1)
        );
        uncertaintySigma = Number(
          Math.max(0.2, (pessimisticDays - optimisticDays) / 6).toFixed(2)
        );
      }
    }

    const assignedTeam = inferIssueTeam(issue, projectKey, teams, index);
    const assignedGoalId = goalLabel
      ? goalLabel.slice(5).toUpperCase()
      : defaultGoals[index < Math.ceil(rawIssues.length * 0.55) ? 0 : 1].id;

    const issueTypeName = issue.fields.issuetype?.name || 'Task';
    const isStageGate =
      issueTypeName.toLowerCase() === 'milestone' ||
      issueTypeName.toLowerCase() === 'gate' ||
      (issue.fields.summary ?? '').toLowerCase().includes('gate');

    const normalizedStat = normalizeStatus(statusName);
    const plannedEffortDays = baseEstimateDays;
    const actualEffortDays =
      normalizedStat === 'Done'
        ? baseEstimateDays
        : normalizedStat === 'In Progress'
          ? Number((baseEstimateDays * 0.55).toFixed(1))
          : normalizedStat === 'Blocked'
            ? Number((baseEstimateDays * 0.4).toFixed(1))
            : 0;

    // Compute Sub-task / Epic child completion metrics for Concept 1 + Concept 3 progress rings
    const explicitSubtasks = issue.fields.subtasks ?? [];
    const epicChildren = childrenByParentKey.get(issue.key) ?? [];
    const childStatuses: string[] =
      explicitSubtasks.length > 0
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
        } else if (st === 'In Progress') {
          weightedDone += 0.6;
        } else if (st === 'Blocked') {
          weightedDone += 0.35;
        }
      }
      subtaskProgressPct = Math.min(
        100,
        Math.max(10, Math.round((weightedDone / subtaskTotalCount) * 100))
      );
    } else {
      subtaskTotalCount = Math.max(3, Math.min(8, Math.round(baseEstimateDays)));
      if (normalizedStat === 'Done') {
        subtaskDoneCount = subtaskTotalCount;
        subtaskProgressPct = 100;
      } else if (normalizedStat === 'In Progress') {
        subtaskDoneCount = Math.max(1, Math.round(subtaskTotalCount * 0.67));
        subtaskProgressPct = Math.round((subtaskDoneCount / subtaskTotalCount) * 100);
      } else if (normalizedStat === 'Blocked') {
        subtaskDoneCount = Math.max(1, Math.round(subtaskTotalCount * 0.4));
        subtaskProgressPct = Math.round((subtaskDoneCount / subtaskTotalCount) * 100);
      } else {
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

      const isHardBlock =
        typeName.includes('block') ||
        typeName.includes('depend') ||
        outwardDesc.includes('block') ||
        inwardDesc.includes('block') ||
        inwardDesc.includes('depend');

      const isReverseDependsOutward =
        !outwardDesc.includes('block') &&
        (outwardDesc.includes('depend') ||
          (typeName.includes('depend') && !outwardDesc.includes('is depended on')));

      const weight = isHardBlock ? 1.0 : 0.65;
      const depLabel = isHardBlock ? 'Blocks' : 'Architectural Decision';

      if (link.outwardIssue?.key) {
        if (isReverseDependsOutward) {
          rawEdges.push({
            from: link.outwardIssue.key,
            to: issue.key,
            dependencyType: 'Depends on',
            propagationWeight: weight,
          });
        } else {
          rawEdges.push({
            from: issue.key,
            to: link.outwardIssue.key,
            dependencyType: depLabel,
            propagationWeight: weight,
          });
        }
      }
      if (link.inwardIssue?.key) {
        if (isReverseDependsOutward) {
          rawEdges.push({
            from: issue.key,
            to: link.inwardIssue.key,
            dependencyType: 'Depends on',
            propagationWeight: weight,
          });
        } else {
          rawEdges.push({
            from: link.inwardIssue.key,
            to: issue.key,
            dependencyType: 'Depends on',
            propagationWeight: weight,
          });
        }
      }
    }
  });

  const nodeKeySet = new Set(nodes.map((n) => n.key));
  const internalEdgesCount = rawEdges.filter(
    (e) => nodeKeySet.has(e.from) && nodeKeySet.has(e.to) && e.from !== e.to
  ).length;

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
  const resolvedTeams: TeamMetadata[] =
    teams.length > 0
      ? teams
      : uniqueTeamNames.length > 0
        ? uniqueTeamNames.map((tName, idx) => {
            const teamNodes = nodes.filter((n) => n.team === tName);
            const assigneeCounts = new Map<string, number>();
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
            const dynamicLoad = Math.min(
              95,
              Math.max(48, 50 + activeCount * 4 + blockedCount * 8)
            );
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
    const candidateTeam =
      teams.length === 0 && resolvedTeams.length > 0
        ? resolvedTeams[idx % resolvedTeams.length]
        : undefined;
    const ownerLabel =
      candidateTeam && candidateTeam.name !== 'No Team Assigned'
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
function inferIssueTeam(
  issue: RawJiraIssue,
  _projectKey: string,
  explicitTeams: TeamMetadata[],
  index: number
): string {
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
    if (tfName.length > 0) return tfName;
  }

  if (explicitTeams.length > 0) {
    return explicitTeams[index % explicitTeams.length].name;
  }

  return 'No Team Assigned';
}

function normalizeStatus(raw: string): string {
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

export function addCalendarDays(isoDate: string, daysToAdd: number): string {
  const base = new Date(`${isoDate.slice(0, 10)}T00:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + Math.round(daysToAdd));
  return base.toISOString().slice(0, 10);
}
