/**
 * Project World Model (PWM) — Atlassian MCP Webtrigger Endpoint (`src/mcp/server.ts`)
 *
 * Exposes the Causal DAG, Counterfactual Simulator, and Atlassian Teamwork Graph
 * via an MCP-compatible JSON-RPC 2.0 server (`mcp-world-model-endpoint`).
 * Supports `tools/list` (including `pwm_simulate_intervention` & `pwm_get_critical_path`)
 * and `tools/call`.
 */

import {
  AssigneeInterventionOverride,
  NodeInterventionOverride,
} from '../engine/types';
import {
  analyzeCriticalPath,
  seedDemoScenario,
  simulateDelayImpact,
} from '../rovo/actions';
import { fetchProjectCausalGraph } from '../twg/graphFetcher';

export interface ForgeWebtriggerRequest {
  method?: string;
  body?: string;
  queryParameters?: Record<string, string[]>;
  headers?: Record<string, string | string[]>;
}

function asPlainRecord<T>(val: unknown): Record<string, T> | undefined {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return undefined;
  return val as Record<string, T>;
}

export interface ForgeWebtriggerResponse {
  statusCode: number;
  headers: Record<string, string[]>;
  body: string;
}

const PROJECT_KEY_DESCRIPTION =
  'Optional Jira project key (defaults to active live Jira project, or Project Chronos fallback when empty/offline)';

const SIMULATE_INTERVENTION_INPUT_SCHEMA = {
  type: 'object',
  properties: {
    issueKey: {
      type: 'string',
      description:
        'Optional Jira issue key to intervene on (defaults to top critical-path bottleneck or assignee blocker)',
    },
    delayDays: {
      type: 'number',
      description:
        'Signed counterfactual shift in days (-5 to +60; defaults to 0 when mitigations/overrides are set, else 7)',
    },
    addDeveloper: {
      type: 'boolean',
      description: 'Simulate adding a developer (+1 resource swarm)',
    },
    decoupleBlockingEdges: {
      type: 'boolean',
      description: 'Simulate decoupling hard blocking outgoing edges',
    },
    trimScope: {
      type: 'boolean',
      description:
        'Simulate trimming or deferring non-essential sub-tasks to the next cycle (-35% duration, -45% uncertainty)',
    },
    assigneeName: {
      type: 'string',
      description:
        'Optional Jira assignee display name for person-level capacity or absence simulation',
    },
    unavailableDays: {
      type: 'number',
      description:
        'Signed unavailability or PTO shift in days (-3 to +15) across the assignee active issues',
    },
    personMitigation: {
      type: 'string',
      description:
        'Comma-separated person mitigations (reassign, serialize, pair) for assigneeName',
    },
    reassignBottleneck: {
      type: 'boolean',
      description:
        'Offload assignee parallel bottleneck issue to eliminate concurrent WIP contention',
    },
    serializeParallelWork: {
      type: 'boolean',
      description:
        'Serialize assignee concurrent tasks to eliminate context-switching variance',
    },
    pairOnTopBlocker: {
      type: 'boolean',
      description:
        'Pair an extra developer on assignee highest-impact critical blocker issue',
    },
    compoundOverridesJson: {
      type: 'string',
      description:
        'Optional JSON string mapping additional issue keys to { deltaDays, addDeveloper, decoupleBlockingEdges, trimScope }',
    },
    nodeOverrides: {
      type: 'object',
      description:
        'Optional map of additional issue keys to { deltaDays, addDeveloper, decoupleBlockingEdges, trimScope } for compound multi-task What-If simulation',
    },
    assigneeOverrides: {
      type: 'object',
      description:
        'Optional map of assignee display names to { assignee, unavailableDays, reassignBottleneck, serializeParallelWork, pairOnTopBlocker } for person-level capacity simulation',
    },
    projectKey: {
      type: 'string',
      description: PROJECT_KEY_DESCRIPTION,
    },
    cloudId: {
      type: 'string',
      description:
        'Optional Atlassian Cloud site ID for Teamwork Graph GraphQL queries',
    },
  },
};

export const MCP_TOOLS_MANIFEST = [
  {
    name: 'pwm_simulate_intervention',
    description:
      'Runs a 500-iteration Pearl do-calculus counterfactual Monte Carlo simulation do(issueKey = deltaDays) on the Project World Model DAG supporting recovery mitigations, person capacity, and compound overrides.',
    inputSchema: SIMULATE_INTERVENTION_INPUT_SCHEMA,
  },
  {
    name: 'pwm_get_critical_path',
    description:
      'Computes cycle-safe topological sorting, critical path nodes, top 3 bottlenecks by downstream ripple weight, and P50/P85/P95 completion dates.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: PROJECT_KEY_DESCRIPTION,
        },
        cloudId: {
          type: 'string',
          description:
            'Optional Atlassian Cloud site ID for Teamwork Graph GraphQL queries',
        },
      },
    },
  },
  {
    name: 'pwm_simulate_delay_impact',
    description:
      'Alias for pwm_simulate_intervention — runs counterfactual simulation supporting issue shifts, mitigations, person capacity, and compound overrides.',
    inputSchema: SIMULATE_INTERVENTION_INPUT_SCHEMA,
  },
  {
    name: 'pwm_analyze_critical_path',
    description:
      'Alias for pwm_get_critical_path — returns topological critical path and top bottlenecks.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: PROJECT_KEY_DESCRIPTION,
        },
        cloudId: {
          type: 'string',
          description:
            'Optional Atlassian Cloud site ID for Teamwork Graph GraphQL queries',
        },
      },
    },
  },
  {
    name: 'pwm_seed_demo_scenario',
    description:
      'Seeds the 18-node Project Chronos: Next-Gen Platform Launch multi-team dependency graph across 3 teams and 2 Teamwork Graph Goals.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: PROJECT_KEY_DESCRIPTION,
        },
        populateJiraIssues: { type: 'boolean' },
      },
    },
  },
  {
    name: 'pwm_get_causal_graph',
    description:
      'Returns the complete Project World Model DAG (nodes, causal edges, Teamwork Graph goals, teams, and topological order).',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: PROJECT_KEY_DESCRIPTION,
        },
        cloudId: {
          type: 'string',
          description:
            'Optional Atlassian Cloud site ID for Teamwork Graph GraphQL queries',
        },
      },
    },
  },
];

function buildJsonResponse(statusCode: number, payload: unknown): ForgeWebtriggerResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': ['application/json; charset=utf-8'],
      'Access-Control-Allow-Origin': ['*'],
      'Access-Control-Allow-Methods': ['GET, POST, OPTIONS'],
      'Access-Control-Allow-Headers': ['Content-Type, Authorization'],
    },
    body: JSON.stringify(payload, null, 2),
  };
}

function extractWebtriggerCloudId(
  context?: { cloudId?: string; installContext?: string },
  explicitCloudId?: unknown
): string | undefined {
  for (const raw of [explicitCloudId, context?.cloudId]) {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.length > 0 && trimmed !== 'current') {
        return trimmed;
      }
    }
  }
  return undefined;
}

/**
 * Forge `webtrigger` handler (`mcp-world-model-endpoint`).
 * Supports MCP JSON-RPC 2.0 (`initialize`, `tools/list`, `tools/call`) and GET discovery.
 */
export async function mcpWebtriggerHandler(
  req: ForgeWebtriggerRequest,
  context?: { cloudId?: string; installContext?: string }
): Promise<ForgeWebtriggerResponse> {
  if (req.method === 'OPTIONS') {
    return buildJsonResponse(200, { ok: true });
  }

  try {
    if (!req.body || req.method === 'GET') {
      const toolParam = req.queryParameters?.tool?.[0];
      const projectKey = req.queryParameters?.projectKey?.[0];
      const queryCloudId = extractWebtriggerCloudId(
        context,
        req.queryParameters?.cloudId?.[0]
      );

      if (
        toolParam === 'pwm_simulate_intervention' ||
        toolParam === 'pwm_simulate_delay_impact'
      ) {
        const issueKey = req.queryParameters?.issueKey?.[0];
        const rawDelay = req.queryParameters?.delayDays?.[0];
        const delayDays =
          rawDelay !== undefined && rawDelay !== '' ? Number(rawDelay) : 8;
        const sim = await simulateDelayImpact({
          issueKey,
          delayDays,
          projectKey,
          cloudId: queryCloudId,
        });
        return buildJsonResponse(200, sim);
      }

      if (
        toolParam === 'pwm_get_critical_path' ||
        toolParam === 'pwm_analyze_critical_path'
      ) {
        const analysis = await analyzeCriticalPath({
          projectKey,
          cloudId: queryCloudId,
        });
        return buildJsonResponse(200, analysis);
      }

      return buildJsonResponse(200, {
        protocolVersion: '2024-11-05',
        serverInfo: {
          name: 'rovo-world-model-mcp',
          version: '1.0.0',
          description:
            'Atlassian Forge MCP Server for Rovo-World-Model',
        },
        tools: MCP_TOOLS_MANIFEST,
      });
    }

    const parsed = JSON.parse(req.body) as {
      jsonrpc?: string;
      id?: string | number | null;
      method?: string;
      params?: Record<string, unknown>;
      tool?: string;
      arguments?: Record<string, unknown>;
    };

    const rpcId = parsed.id ?? 1;
    const method = parsed.method || (parsed.tool ? 'tools/call' : 'tools/list');

    if (method === 'initialize') {
      return buildJsonResponse(200, {
        jsonrpc: '2.0',
        id: rpcId,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: { listChanged: false },
          },
          serverInfo: {
            name: 'rovo-world-model-mcp',
            version: '1.0.0',
          },
        },
      });
    }

    if (method === 'tools/list') {
      return buildJsonResponse(200, {
        jsonrpc: '2.0',
        id: rpcId,
        result: {
          tools: MCP_TOOLS_MANIFEST,
        },
      });
    }

    if (method === 'tools/call') {
      const toolName = String(parsed.params?.name ?? parsed.tool ?? '');
      const args =
        (parsed.params?.arguments as Record<string, unknown> | undefined) ??
        parsed.arguments ??
        {};
      const callCloudId = extractWebtriggerCloudId(context, args.cloudId);

      let toolOutput: unknown;
      if (
        toolName === 'pwm_simulate_intervention' ||
        toolName === 'pwm_simulate_delay_impact' ||
        toolName === 'simulate-delay-impact'
      ) {
        const rawDelay = args.delayDays;
        const delayDays =
          rawDelay !== undefined && rawDelay !== ''
            ? Number(rawDelay)
            : undefined;
        toolOutput = await simulateDelayImpact({
          issueKey: args.issueKey ? String(args.issueKey) : undefined,
          delayDays:
            delayDays !== undefined && Number.isFinite(delayDays)
              ? delayDays
              : undefined,
          addDeveloper: Boolean(args.addDeveloper),
          decoupleBlockingEdges: Boolean(args.decoupleBlockingEdges),
          trimScope: Boolean(args.trimScope),
          assigneeName: args.assigneeName ? String(args.assigneeName) : undefined,
          unavailableDays:
            args.unavailableDays !== undefined && args.unavailableDays !== ''
              ? Number(args.unavailableDays)
              : undefined,
          personMitigation: args.personMitigation
            ? String(args.personMitigation)
            : undefined,
          reassignBottleneck: Boolean(args.reassignBottleneck),
          serializeParallelWork: Boolean(args.serializeParallelWork),
          pairOnTopBlocker: Boolean(args.pairOnTopBlocker),
          compoundOverridesJson: args.compoundOverridesJson
            ? String(args.compoundOverridesJson)
            : undefined,
          nodeOverrides: asPlainRecord<NodeInterventionOverride>(args.nodeOverrides),
          assigneeOverrides: asPlainRecord<AssigneeInterventionOverride>(
            args.assigneeOverrides
          ),
          projectKey: args.projectKey ? String(args.projectKey) : undefined,
          cloudId: callCloudId,
        });
      } else if (
        toolName === 'pwm_get_critical_path' ||
        toolName === 'pwm_analyze_critical_path' ||
        toolName === 'analyze-critical-path'
      ) {
        toolOutput = await analyzeCriticalPath({
          projectKey: args.projectKey ? String(args.projectKey) : undefined,
          cloudId: callCloudId,
        });
      } else if (
        toolName === 'pwm_seed_demo_scenario' ||
        toolName === 'seed-demo-scenario'
      ) {
        const rawConfirmHeader =
          req.headers?.['x-pwm-confirm-write'] ??
          req.headers?.['X-PWM-Confirm-Write'] ??
          '';
        const confirmWriteHeader = Array.isArray(rawConfirmHeader)
          ? rawConfirmHeader[0] ?? ''
          : rawConfirmHeader;
        const allowPopulateJira =
          Boolean(args.populateJiraIssues) &&
          String(confirmWriteHeader).toLowerCase() === 'true';

        toolOutput = await seedDemoScenario({
          projectKey: args.projectKey ? String(args.projectKey) : undefined,
          populateJiraIssues: allowPopulateJira,
        });
      } else if (toolName === 'pwm_get_causal_graph') {
        toolOutput = await fetchProjectCausalGraph({
          projectKey: args.projectKey ? String(args.projectKey) : undefined,
          cloudId: callCloudId,
        });
      } else {
        return buildJsonResponse(400, {
          jsonrpc: '2.0',
          id: rpcId,
          error: {
            code: -32601,
            message: `Unknown MCP tool: ${toolName}`,
          },
        });
      }

      return buildJsonResponse(200, {
        jsonrpc: '2.0',
        id: rpcId,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(toolOutput, null, 2),
            },
          ],
          structuredContent: toolOutput,
        },
      });
    }

    return buildJsonResponse(200, {
      jsonrpc: '2.0',
      id: rpcId,
      result: {
        tools: MCP_TOOLS_MANIFEST,
      },
    });
  } catch (error) {
    return buildJsonResponse(500, {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal MCP server error',
      },
    });
  }
}

