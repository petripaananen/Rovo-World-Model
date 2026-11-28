/**
 * Project World Model (PWM) — Atlassian MCP Webtrigger Endpoint (`src/mcp/server.ts`)
 *
 * Exposes the Causal DAG, Counterfactual Simulator, and Atlassian Teamwork Graph
 * via an MCP-compatible JSON-RPC 2.0 server (`mcp-world-model-endpoint`).
 * Supports `tools/list` (including `pwm_simulate_intervention` & `pwm_get_critical_path`)
 * and `tools/call` with Bearer token authentication and strict CORS/input guards.
 */

import crypto from 'node:crypto';
import {
  AssigneeInterventionOverride,
  NodeInterventionOverride,
  SIMULATION_BOUNDS,
  isReservedObjectKey,
} from '../engine/types';
import {
  analyzeCriticalPath,
  seedDemoScenario,
  simulateDelayImpact,
} from '../rovo/actions';
import { fetchProjectCausalGraph } from '../twg/graphFetcher';
import { MCP_TOOLS_MANIFEST } from './manifest';

export { MCP_TOOLS_MANIFEST };

export interface ForgeWebtriggerRequest {
  method?: string;
  body?: string;
  queryParameters?: Record<string, string[]>;
  headers?: Record<string, string | string[]>;
}

export interface ForgeWebtriggerResponse {
  statusCode: number;
  headers: Record<string, string[]>;
  body: string;
}

const MCP_BEARER_SECRET_KEY = 'pwm:mcp:bearerToken';

function getHeaderValue(
  headers: Record<string, string | string[]> | undefined,
  headerName: string
): string {
  if (!headers) return '';
  const target = headerName.toLowerCase();
  for (const [key, val] of Object.entries(headers)) {
    if (key.toLowerCase() === target) {
      return Array.isArray(val) ? String(val[0] ?? '') : String(val ?? '');
    }
  }
  return '';
}

function asPlainRecord<T>(val: unknown): Record<string, T> | undefined {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return undefined;
  const clean: Record<string, T> = Object.create(null);
  let count = 0;
  for (const [k, v] of Object.entries(val as Record<string, T>)) {
    if (isReservedObjectKey(k)) continue;
    if (++count > SIMULATION_BOUNDS.MAX_OVERRIDE_ENTRIES) break;
    clean[k] = v;
  }
  return clean;
}

function timingSafeTokenMatch(expected: string, provided: string): boolean {
  const expectedBuf = Buffer.from(expected, 'utf8');
  const providedBuf = Buffer.from(provided, 'utf8');
  if (expectedBuf.length === 0 || expectedBuf.length !== providedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

async function resolveExpectedBearerSecret(
  isLiveForgeContext: boolean
): Promise<string | undefined> {
  const envToken = process.env.PWM_MCP_BEARER_TOKEN?.trim();
  if (envToken) return envToken;
  if (!isLiveForgeContext) return undefined;

  try {
    const forgeApi = await import('@forge/api');
    const getSecret = forgeApi?.storage?.getSecret as
      | ((key: string) => Promise<unknown>)
      | undefined;
    if (typeof getSecret === 'function') {
      const secretVal = await getSecret(MCP_BEARER_SECRET_KEY);
      if (typeof secretVal === 'string' && secretVal.trim().length > 0) {
        return secretVal.trim();
      }
    }
  } catch {
    // Storage secret unavailable
  }
  return undefined;
}

async function verifyMcpBearerAuth(
  req: ForgeWebtriggerRequest,
  context?: { cloudId?: string; installContext?: string }
): Promise<{ authorized: boolean; statusCode?: number; message?: string }> {
  const isLiveForgeContext = Boolean(context?.cloudId || context?.installContext);
  const expectedSecret = await resolveExpectedBearerSecret(isLiveForgeContext);

  if (!expectedSecret) {
    if (isLiveForgeContext) {
      return {
        authorized: false,
        statusCode: 401,
        message:
          'Unauthorized: MCP bearer token is not provisioned yet. Open Rovo-World-Model in Jira first or use native rovo:mcp.',
      };
    }
    // Local offline unit tests without Forge context or env token
    return { authorized: true };
  }

  const authHeader = getHeaderValue(req.headers, 'authorization').trim();
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const providedToken = bearerMatch?.[1]?.trim() ?? '';
  if (!providedToken || !timingSafeTokenMatch(expectedSecret, providedToken)) {
    return {
      authorized: false,
      statusCode: 401,
      message: 'Unauthorized: valid Bearer token required.',
    };
  }
  return { authorized: true };
}

function buildJsonResponse(
  statusCode: number,
  payload: unknown,
  req?: ForgeWebtriggerRequest
): ForgeWebtriggerResponse {
  const headers: Record<string, string[]> = {
    'Content-Type': ['application/json; charset=utf-8'],
    'X-Content-Type-Options': ['nosniff'],
    'Cache-Control': ['no-store'],
    'Referrer-Policy': ['no-referrer'],
    'Access-Control-Allow-Methods': ['GET, POST, OPTIONS'],
    'Access-Control-Allow-Headers': [
      'Content-Type, Authorization, X-PWM-Confirm-Write',
    ],
  };

  // Never emit wildcard CORS; only echo an explicitly configured allowlisted origin
  const rawAllowed = process.env.PWM_MCP_ALLOWED_ORIGINS ?? '';
  const reqOrigin = getHeaderValue(req?.headers, 'origin').trim();
  if (rawAllowed && reqOrigin) {
    const allowedSet = new Set(
      rawAllowed
        .split(',')
        .map((o) => o.trim())
        .filter((o) => o.length > 0 && o !== '*')
    );
    if (allowedSet.has(reqOrigin)) {
      headers['Access-Control-Allow-Origin'] = [reqOrigin];
      headers['Vary'] = ['Origin'];
    }
  }

  return {
    statusCode,
    headers,
    body: JSON.stringify(payload, null, 2),
  };
}

function extractWebtriggerCloudId(
  context?: { cloudId?: string; installContext?: string },
  explicitCloudId?: unknown
): string | undefined {
  // Always prioritize Forge-verified context.cloudId over caller-supplied arguments
  for (const raw of [context?.cloudId, explicitCloudId]) {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (
        trimmed.length > 0 &&
        trimmed !== 'current' &&
        /^[a-zA-Z0-9-]{8,64}$/.test(trimmed)
      ) {
        return trimmed;
      }
    }
  }
  return undefined;
}

/**
 * Forge `webtrigger` handler (`mcp-world-model-endpoint`).
 * Supports MCP JSON-RPC 2.0 (`initialize`, `tools/list`, `tools/call`) and authenticated GET discovery.
 */
export async function mcpWebtriggerHandler(
  req: ForgeWebtriggerRequest,
  context?: { cloudId?: string; installContext?: string }
): Promise<ForgeWebtriggerResponse> {
  if (req.method === 'OPTIONS') {
    return buildJsonResponse(200, { ok: true }, req);
  }

  const authCheck = await verifyMcpBearerAuth(req, context);
  if (!authCheck.authorized) {
    return buildJsonResponse(
      authCheck.statusCode ?? 401,
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32001,
          message: authCheck.message ?? 'Unauthorized',
        },
      },
      req
    );
  }

  try {
    if (!req.body || req.method === 'GET') {
      // Security hardening: GET returns static MCP server discovery metadata only (never runs data queries via URL)
      return buildJsonResponse(
        200,
        {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: 'rovo-world-model-mcp',
            version: '1.0.0',
            description: 'Atlassian Forge MCP Server for Rovo-World-Model',
          },
          tools: MCP_TOOLS_MANIFEST,
        },
        req
      );
    }

    if (req.body.length > SIMULATION_BOUNDS.MAX_MCP_BODY_BYTES) {
      return buildJsonResponse(
        413,
        {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32600,
            message: 'Request payload exceeds maximum allowed size',
          },
        },
        req
      );
    }

    let parsed: {
      jsonrpc?: string;
      id?: string | number | null;
      method?: string;
      params?: Record<string, unknown>;
      tool?: string;
      arguments?: Record<string, unknown>;
    };
    try {
      parsed = JSON.parse(req.body);
    } catch {
      return buildJsonResponse(
        400,
        {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error: invalid JSON body',
          },
        },
        req
      );
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return buildJsonResponse(
        400,
        {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32600,
            message: 'Invalid Request: JSON-RPC payload must be an object',
          },
        },
        req
      );
    }

    const rpcId = parsed.id ?? 1;
    const method = parsed.method || (parsed.tool ? 'tools/call' : '');

    if (method === 'initialize') {
      return buildJsonResponse(
        200,
        {
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
        },
        req
      );
    }

    if (method === 'tools/list') {
      return buildJsonResponse(
        200,
        {
          jsonrpc: '2.0',
          id: rpcId,
          result: {
            tools: MCP_TOOLS_MANIFEST,
          },
        },
        req
      );
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
          authMode: 'app',
        });
      } else if (
        toolName === 'pwm_get_critical_path' ||
        toolName === 'pwm_analyze_critical_path' ||
        toolName === 'analyze-critical-path'
      ) {
        toolOutput = await analyzeCriticalPath({
          projectKey: args.projectKey ? String(args.projectKey) : undefined,
          cloudId: callCloudId,
          authMode: 'app',
        });
      } else if (
        toolName === 'pwm_seed_demo_scenario' ||
        toolName === 'seed-demo-scenario'
      ) {
        const confirmWriteHeader = getHeaderValue(
          req.headers,
          'x-pwm-confirm-write'
        ).trim();
        const wantsPopulate = Boolean(args.populateJiraIssues);
        const hasConfirmHeader = confirmWriteHeader.toLowerCase() === 'true';
        let allowPopulateJira = wantsPopulate && hasConfirmHeader;

        const targetProjectKey = args.projectKey
          ? String(args.projectKey).trim().toUpperCase()
          : undefined;

        if (allowPopulateJira) {
          if (
            !targetProjectKey ||
            !/^[A-Z][A-Z0-9_]{0,15}$/.test(targetProjectKey)
          ) {
            return buildJsonResponse(
              400,
              {
                jsonrpc: '2.0',
                id: rpcId,
                error: {
                  code: -32602,
                  message:
                    'Invalid params: valid projectKey is required when populateJiraIssues is true',
                },
              },
              req
            );
          }
          const existing = await fetchProjectCausalGraph({
            projectKey: targetProjectKey,
            cloudId: callCloudId,
            authMode: 'app',
          });
          if (!existing.isSyntheticDemo && existing.nodes.length > 0) {
            allowPopulateJira = false;
          }
        }

        toolOutput = await seedDemoScenario({
          projectKey: targetProjectKey,
          populateJiraIssues: allowPopulateJira,
          authMode: 'app',
        });
      } else if (toolName === 'pwm_get_causal_graph') {
        toolOutput = await fetchProjectCausalGraph({
          projectKey: args.projectKey ? String(args.projectKey) : undefined,
          cloudId: callCloudId,
          authMode: 'app',
        });
      } else {
        return buildJsonResponse(
          400,
          {
            jsonrpc: '2.0',
            id: rpcId,
            error: {
              code: -32601,
              message: `Unknown MCP tool: ${toolName}`,
            },
          },
          req
        );
      }

      return buildJsonResponse(
        200,
        {
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
        },
        req
      );
    }

    return buildJsonResponse(
      400,
      {
        jsonrpc: '2.0',
        id: rpcId,
        error: {
          code: -32601,
          message: `Method not found: ${method || '(empty)'}`,
        },
      },
      req
    );
  } catch (error) {
    console.error('[PWM MCP Error]', error);
    return buildJsonResponse(
      500,
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'Internal MCP server error',
        },
      },
      req
    );
  }
}
