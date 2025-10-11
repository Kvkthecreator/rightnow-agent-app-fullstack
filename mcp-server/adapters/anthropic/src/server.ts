#!/usr/bin/env node
/**
 * YARNNN MCP Server
 *
 * Exposes YARNNN substrate memory to LLM hosts via Model Context Protocol
 *
 * Architecture:
 * - LLM Host (ChatGPT/Claude) → MCP Protocol → This Server → YARNNN Backend API
 * - Supports stdio (local) and HTTP+SSE (cloud) transports
 * - Validates auth tokens against YARNNN backend
 * - Provides 4 tools: create_memory, get_substrate, add_substrate, validate
 */

import { createServer } from 'node:http';
import { performance } from 'node:perf_hooks';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { config, validateConfig } from './config.js';
import {
  validateAuth,
  extractToken,
  YARNNNClient,
  getToolsList,
  executeTool,
  selectBasket,
  type BasketSelection,
  type BasketCandidate,
  type SessionFingerprint,
  type UserContext,
  YARNNNAPIError,
} from '@yarnnn/integration-core';

/**
 * Initialize MCP Server
 */
async function main() {
  try {
    // Validate configuration
    validateConfig();

    // Create MCP server instance
    const server = new Server(
      {
        name: 'yarnnn-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    /**
     * Handle tool list request
     */
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: getToolsList(),
      };
    });

    /**
     * Handle tool execution request
     */
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const startedAt = performance.now();
      let userContext: UserContext | null = null;
      let fingerprint: SessionFingerprint | null = null;
      let session: string | null = null;
      const toolName = request.params.name;

      try {
        // Extract and validate auth token
        const userToken = extractToken(request.params._meta);
        userContext = await validateAuth(config.backendUrl, userToken);

        console.log(`[AUTH] User authenticated:`, {
          userId: userContext.userId,
          workspaceId: userContext.workspaceId,
          basketId: userContext.basketId || 'none',
        });

        // Create YARNNN client
        const client = new YARNNNClient({
          baseUrl: config.backendUrl,
          userContext,
          userToken,
        });

        // Execute tool
        const toolInput = request.params.arguments || {};
        fingerprint = extractFingerprint(toolInput);
        session = extractSessionId(request.params._meta);

        console.log(`[TOOL] Executing: ${toolName}`, toolInput);

        const selection = await resolveBasketSelection(
          toolName,
          fingerprint,
          client
        );

        if (selection?.decision === 'pick') {
          await createUnassignedCapture({
            client,
            toolName,
            toolInput,
            fingerprint,
            selection,
            userContext,
            session,
          });

          await recordActivityLog({
            userContext,
            toolName,
            result: 'queued',
            selection,
            fingerprint,
            session,
            latencyMs: Math.round(performance.now() - startedAt),
          });

          const queuedResult = {
            status: 'queued',
            message: 'Low-confidence basket selection. Review the capture in Yarnnn to assign a basket.',
            _basket_selection: selection,
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(queuedResult, null, 2),
              },
            ],
          };
        }

        const result = await executeTool(toolName, toolInput, client);

        if (selection) {
          (result as any)._basket_selection = selection;
          (result as any).selection_summary = summarizeSelection(selection);
        }

        console.log(`[TOOL] Success: ${toolName}`, result);

        await recordActivityLog({
          userContext,
          toolName,
          result: 'success',
          selection,
          fingerprint,
          session,
          latencyMs: Math.round(performance.now() - startedAt),
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error(`[ERROR] Tool execution failed:`, error);

        if (userContext) {
          await recordActivityLog({
            userContext,
            toolName,
            result: 'error',
            selection: undefined,
            fingerprint,
            session,
            latencyMs: Math.round(performance.now() - startedAt),
            error,
          });
        }

        if (error instanceof YARNNNAPIError && error.status === 401) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'Authentication required. Visit https://yarnnn.com/connect to link your YARNNN workspace.'
          );
        }

        if (error instanceof Error) {
          throw new McpError(
            ErrorCode.InternalError,
            error.message
          );
        }

        throw new McpError(
          ErrorCode.InternalError,
          'Tool execution failed'
        );
      }
    });

    /**
     * Start server with appropriate transport
     */
    if (config.mcpTransport === 'stdio') {
      // Stdio transport for local Claude Desktop
      console.log('[SERVER] Starting MCP server in stdio mode...');
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.log('[SERVER] MCP server running in stdio mode');
    } else {
      // HTTP+SSE transport for cloud deployment
      console.log(`[SERVER] Starting MCP server in HTTP mode on port ${config.port}...`);

      // Map to track active SSE transports by session ID
      const sseTransports = new Map<string, SSEServerTransport>();

      // Create HTTP server for SSE transport
      const httpServer = createServer(async (req, res) => {
        const url = req.url || '';

        console.log('[HTTP] incoming request', {
          method: req.method,
          url,
          userAgent: req.headers['user-agent'],
          host: req.headers.host,
        });

        // CORS headers for cross-origin requests
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // Handle OPTIONS preflight
        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        // Discovery document for remote MCP clients
        if (req.method === 'GET' && url === '/.well-known/mcp.json') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify(
              {
                version: '2024-10-01',
                transports: {
                  sse: {
                    url: `https://${req.headers.host}/sse`,
                  },
                },
                auth: {
                  type: 'bearer',
                },
              },
              null,
              2
            )
          );
          return;
        }

        if (req.method === 'GET' && url.startsWith('/.well-known/oauth-')) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'oauth_not_supported' }));
          return;
        }

        if (req.method === 'POST' && url === '/register') {
          const host = req.headers.host || 'mcp.yarnnn.com';
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify(
              {
                version: '2024-10-01',
                auth: { type: 'bearer' },
                transports: {
                  sse: { url: `https://${host}/sse` },
                },
              },
              null,
              2
            )
          );
          return;
        }

        if (url === '/' && (req.method === 'GET' || req.method === 'POST')) {
          console.log('[HTTP] responding with bearer challenge');
          res.writeHead(401, {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer realm="Yarnnn MCP"',
          });
          res.end(JSON.stringify({ status: 'unauthorized', hint: 'include Authorization: Bearer <token>' }));
          return;
        }

        // GET /sse - Establish SSE connection
        if (req.method === 'GET' && url === '/sse') {
          const transport = new SSEServerTransport('/message', res);

          // Store transport by session ID for routing POST messages
          sseTransports.set(transport.sessionId, transport);

          // Cleanup on close
          transport.onclose = () => {
            sseTransports.delete(transport.sessionId);
            console.log(`[SSE] Session closed: ${transport.sessionId}`);
          };

          try {
            await transport.start();
            await server.connect(transport);
            console.log(`[SSE] Session established: ${transport.sessionId}`);
          } catch (error) {
            console.error('[SSE] Connection failed:', error);
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('SSE connection failed');
            }
          }
          return;
        }

        // POST /message - Handle incoming messages from client
        if (req.method === 'POST' && url.startsWith('/message')) {
          // Extract session ID from query parameter or header
          const sessionId = new URL(url, `http://${req.headers.host}`).searchParams.get('sessionId');

          if (!sessionId) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Missing sessionId parameter');
            return;
          }

          const transport = sseTransports.get(sessionId);
          if (!transport) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Session not found');
            return;
          }

          try {
            await transport.handlePostMessage(req, res);
          } catch (error) {
            console.error('[SSE] Message handling failed:', error);
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Message processing failed');
            }
          }
          return;
        }

        // Health check endpoint
        if (req.method === 'GET' && url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'ok',
            server: 'yarnnn-mcp-server',
            version: '1.0.0',
            activeSessions: sseTransports.size,
          }));
          return;
        }

        // 404 for unknown routes
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      });

      // Start HTTP server
      await new Promise<void>((resolve) => {
        httpServer.listen(config.port, '0.0.0.0', () => {
          console.log(`[SERVER] MCP server running on http://0.0.0.0:${config.port}`);
          console.log(`[SERVER] SSE endpoint: http://0.0.0.0:${config.port}/sse`);
          console.log(`[SERVER] Health check: http://0.0.0.0:${config.port}/health`);
          resolve();
        });
      });

      // Store server reference for graceful shutdown
      (server as any)._httpServer = httpServer;
    }

    /**
     * Graceful shutdown
     */
    const shutdown = async () => {
      console.log('[SERVER] Shutting down gracefully...');

      // Close HTTP server if running
      const httpServer = (server as any)._httpServer;
      if (httpServer) {
        await new Promise<void>((resolve) => {
          httpServer.close(() => {
            console.log('[SERVER] HTTP server closed');
            resolve();
          });
        });
      }

      await server.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[FATAL] Server initialization failed:', error);
    process.exit(1);
  }
}

async function resolveBasketSelection(
  toolName: string,
  fingerprint: SessionFingerprint | null,
  client: YARNNNClient
): Promise<BasketSelection | null> {
  if (!fingerprint) {
    return null;
  }

  try {
    const response = await client.post<BasketInferenceResponse>(
      '/api/mcp/baskets/infer',
      {
        tool: toolName,
        fingerprint,
      }
    );
    const candidates = response?.candidates ?? [];
    return selectBasket(fingerprint, candidates);
  } catch (error) {
    console.warn('[BASKET] inference unavailable; proceeding without selection', error);
    return null;
  }
}

async function createUnassignedCapture(params: {
  client: YARNNNClient;
  toolName: string;
  toolInput: any;
  fingerprint: SessionFingerprint | null;
  selection: BasketSelection;
  userContext: any;
  session?: string | null;
}) {
  if (!config.sharedSecret) {
    console.warn('[UNASSIGNED] MCP_SHARED_SECRET not configured; skipping capture creation');
    return;
  }

  try {
    const summary =
      params.fingerprint?.summary ||
      (typeof params.toolInput?.content === 'string'
        ? `${params.toolInput.content.slice(0, 160)}${params.toolInput.content.length > 160 ? '…' : ''}`
        : `Pending review for ${params.toolName}`);

    const candidates = params.selection.ranked.map((candidate) => ({
      id: candidate.basket.id,
      name: candidate.basket.name,
      score: candidate.score,
    }));

    await fetch(`${config.backendUrl}/api/memory/unassigned`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-yarnnn-mcp-secret': config.sharedSecret,
      },
      body: JSON.stringify({
        workspace_id: params.userContext.workspaceId,
        tool: params.toolName,
        summary,
        payload: params.toolInput,
        fingerprint: params.fingerprint,
        candidates,
        requested_by: params.userContext.userId,
        source_host: 'claude',
        source_session: params.session,
      }),
    });
  } catch (error) {
    console.error('[UNASSIGNED] Failed to create capture', error);
  }
}

function extractSessionId(meta: any): string | null {
  if (!meta || typeof meta !== 'object') return null;
  return meta.sessionId || meta.session_id || meta.session || null;
}

async function recordActivityLog(params: {
  userContext: any;
  toolName: string;
  result: 'success' | 'queued' | 'error';
  selection?: BasketSelection | null;
  fingerprint?: SessionFingerprint | null;
  session?: string | null;
  latencyMs?: number;
  error?: unknown;
}) {
  if (!config.sharedSecret) {
    return;
  }

  const primaryBasket = params.selection?.primary?.basket?.id;
  const selectionScore = params.selection?.primary?.score ?? null;
  const errorCode = params.error instanceof YARNNNAPIError
    ? params.error.code
    : params.error instanceof McpError
    ? params.error.code
    : params.error instanceof Error
    ? params.error.name
    : undefined;

  const body = {
    workspace_id: params.userContext.workspaceId,
    user_id: params.userContext.userId,
    tool: params.toolName,
    host: 'claude',
    result: params.result,
    latency_ms: params.latencyMs,
    basket_id: primaryBasket || params.userContext.basketId || null,
    selection_decision: params.selection?.decision,
    selection_score: selectionScore,
    error_code: errorCode,
    session_id: params.session,
    fingerprint_summary: params.fingerprint?.summary,
    metadata: params.selection
      ? {
          ranked: params.selection.ranked?.slice(0, 3).map((candidate) => ({
            id: candidate.basket.id,
            score: candidate.score,
          })),
          needsTieBreak: params.selection.needsTieBreak,
        }
      : undefined,
  };

  try {
    await fetch(`${config.backendUrl}/api/mcp/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-yarnnn-mcp-secret': config.sharedSecret,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('[ACTIVITY] Failed to record log', error);
  }
}

function extractFingerprint(payload: any): SessionFingerprint | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  if (!payload.session_fingerprint) {
    return null;
  }
  const fp = payload.session_fingerprint;
  if (!Array.isArray(fp.embedding)) {
    return null;
  }
  return {
    embedding: fp.embedding,
    summary: fp.summary,
    intent: fp.intent,
    entities: fp.entities,
    keywords: fp.keywords,
  };
}

interface BasketInferenceResponse {
  candidates: BasketCandidate[];
}

function summarizeSelection(selection: BasketSelection): string {
  const primary = selection.primary;
  if (!primary) {
    return 'Basket inference pending user selection.';
  }

  const basketName = primary.basket.name || 'Unnamed basket';
  const score = primary.score.toFixed(2);
  switch (selection.decision) {
    case 'auto':
      return `🔗 Using ${basketName} (high confidence, score ${score}).`;
    case 'confirm':
      return `🤔 Likely ${basketName} (score ${score})—confirm before writing.`;
    default:
      return `📚 No confident match (top score ${score}). Pick a basket or create a new one.`;
  }
}

// Start server
main().catch((error) => {
  console.error('[FATAL] Unhandled error:', error);
  process.exit(1);
});
