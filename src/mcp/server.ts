/**
 * Project World Model (PWM) — Atlassian MCP Webtrigger Endpoint (`src/mcp/server.ts`)
 *
 * Exposes the Causal DAG, Counterfactual Simulator, and Atlassian Teamwork Graph
 * via an MCP-compatible JSON-RPC 2.0 server (`mcp-world-model-endpoint`).
 * Supports `tools/list` (including `pwm_simulate_intervention` & `pwm_get_critical_path`)
 * and `tools/call`.
 */

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
  headers?: Record<string, string>;
}

export interface ForgeWebtriggerResponse {
  statusCode: number;
  headers: Record<string, string[]>;
  body: string;
}

export const MCP_TOOLS_MANIFEST = [
  {
    name: 'pwm_simulate_intervention',
    description:
      'Runs a 500-iteration Pearl do-calculus counterfactual Monte Carlo simulation do(issueKey = deltaDays) on the Project World Model DAG.',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'Jira issue key to intervene on (e.g., CHRON-104 or CORE-104)',
        },
        delayDays: {
          type: 'number',
          description: 'Signed counterfactual shift in days (-5 to +60)',
        },
        addDeveloper: {
          type: 'boolean',
          description: 'Simulate adding a developer (+1 resource swarm)',
        },
        decoupleBlockingEdges: {
          type: 'boolean',
          description: 'Simulate decoupling hard blocking outgoing edges',
        },
        projectKey: {
          type: 'string',
          description: 'Optional Jira project key (defaults to CHRON)',
        },
      },
      required: ['issueKey', 'delayDays'],
    },
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
          description: 'Optional Jira project key (defaults to CHRON)',
        },
      },
    },
  },
  {
    name: 'pwm_simulate_delay_impact',
    description:
      'Alias for pwm_simulate_intervention — runs counterfactual simulation for issueKey and delayDays.',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: { type: 'string' },
        delayDays: { type: 'number' },
        projectKey: { type: 'string' },
      },
      required: ['issueKey', 'delayDays'],
    },
  },
  {
    name: 'pwm_analyze_critical_path',
    description:
      'Alias for pwm_get_critical_path — returns topological critical path and top bottlenecks.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: { type: 'string' },
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
        projectKey: { type: 'string' },
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
        projectKey: { type: 'string' },
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

/**
 * Forge `webtrigger` handler (`mcp-world-model-endpoint`).
 * Supports MCP JSON-RPC 2.0 (`initialize`, `tools/list`, `tools/call`) and GET discovery.
 */
export async function mcpWebtriggerHandler(
  req: ForgeWebtriggerRequest
): Promise<ForgeWebtriggerResponse> {
  if (req.method === 'OPTIONS') {
    return buildJsonResponse(200, { ok: true });
  }

  try {
    if (!req.body || req.method === 'GET') {
      const toolParam = req.queryParameters?.tool?.[0];
      const projectKey = req.queryParameters?.projectKey?.[0] || 'CHRON';

      if (
        toolParam === 'pwm_simulate_intervention' ||
        toolParam === 'pwm_simulate_delay_impact'
      ) {
        const issueKey = req.queryParameters?.issueKey?.[0] || `${projectKey}-104`;
        const delayDays = Number(req.queryParameters?.delayDays?.[0] ?? 8);
        const sim = await simulateDelayImpact({ issueKey, delayDays, projectKey });
        return buildJsonResponse(200, sim);
      }

      if (
        toolParam === 'pwm_get_critical_path' ||
        toolParam === 'pwm_analyze_critical_path'
      ) {
        const analysis = await analyzeCriticalPath({ projectKey });
        return buildJsonResponse(200, analysis);
      }

      return buildJsonResponse(200, {
        protocolVersion: '2024-11-05',
        serverInfo: {
          name: 'rovo-project-world-model-mcp',
          version: '1.0.0',
          description:
            'Atlassian Forge MCP Server for Project World Model (PWM) & Jira Time Machine',
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
            name: 'rovo-project-world-model-mcp',
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

      let toolOutput: unknown;
      if (
        toolName === 'pwm_simulate_intervention' ||
        toolName === 'pwm_simulate_delay_impact' ||
        toolName === 'simulate-delay-impact'
      ) {
        toolOutput = await simulateDelayImpact({
          issueKey: String(args.issueKey || 'CHRON-104'),
          delayDays: Number(args.delayDays ?? 7),
          addDeveloper: Boolean(args.addDeveloper),
          decoupleBlockingEdges: Boolean(args.decoupleBlockingEdges),
          projectKey: args.projectKey ? String(args.projectKey) : undefined,
        });
      } else if (
        toolName === 'pwm_get_critical_path' ||
        toolName === 'pwm_analyze_critical_path' ||
        toolName === 'analyze-critical-path'
      ) {
        toolOutput = await analyzeCriticalPath({
          projectKey: args.projectKey ? String(args.projectKey) : undefined,
        });
      } else if (
        toolName === 'pwm_seed_demo_scenario' ||
        toolName === 'seed-demo-scenario'
      ) {
        toolOutput = await seedDemoScenario({
          projectKey: args.projectKey ? String(args.projectKey) : undefined,
          populateJiraIssues: Boolean(args.populateJiraIssues),
        });
      } else if (toolName === 'pwm_get_causal_graph') {
        toolOutput = await fetchProjectCausalGraph({
          projectKey: args.projectKey ? String(args.projectKey) : undefined,
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

