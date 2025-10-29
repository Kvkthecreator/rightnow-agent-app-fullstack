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
import {
  getOAuthConfig,
  handleAuthorize,
  handleTokenExchange,
  handleClientRegistration,
  validateOAuthToken,
} from './oauth/index.js';
import {
  getOAuthAuthorizationServerMetadata,
  getOAuthProtectedResourceMetadata,
  getMcpDiscoveryDocument,
} from './discovery.js';

/**
 * Initialize MCP Server
 */
async function main() {
  try {
    // Validate configuration
    validateConfig();

    // Initialize OAuth configuration
    const oauthConfig = getOAuthConfig(config.backendUrl);
    if (oauthConfig.enabled) {
      console.log('[OAuth] OAuth enabled for Claude.ai remote connector');
    }

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
      const toolsList = await getToolsList();
      console.log('[MCP] Returning tools list:', {
        count: toolsList.length,
        tools: toolsList.map(t => t.name)
      });
      return {
        tools: toolsList,
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

        // Standard OAuth 2.0 Authorization Server Metadata (RFC 8414)
        if (req.method === 'GET' && url === '/.well-known/oauth-authorization-server') {
          if (oauthConfig.enabled) {
            const metadata = getOAuthAuthorizationServerMetadata(req.headers.host as string);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(metadata, null, 2));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'oauth_not_enabled' }));
          }
          return;
        }

        // OAuth 2.0 Protected Resource Metadata (RFC 9728)
        if (req.method === 'GET' && url === '/.well-known/oauth-protected-resource') {
          if (oauthConfig.enabled) {
            const metadata = getOAuthProtectedResourceMetadata(req.headers.host as string);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(metadata, null, 2));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'oauth_not_enabled' }));
          }
          return;
        }

        // Discovery document for remote MCP clients
        if (req.method === 'GET' && url === '/.well-known/mcp.json') {
          const discovery = getMcpDiscoveryDocument(req.headers.host as string, oauthConfig.enabled);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(discovery, null, 2));
          return;
        }

        // OAuth authorization endpoint - proxy to backend
        if (req.method === 'GET' && url.startsWith('/authorize')) {
          await handleAuthorize(req, res, oauthConfig);
          return;
        }

        // OAuth token exchange endpoint - proxy to backend
        if (req.method === 'POST' && url === '/token') {
          await handleTokenExchange(req, res, oauthConfig);
          return;
        }

        // OAuth dynamic client registration endpoint (RFC 7591) - proxy to backend
        if (req.method === 'POST' && url === '/register') {
          await handleClientRegistration(req, res, oauthConfig);
          return;
        }

        // Legacy /register endpoint for old clients
        if (req.method === 'POST' && url === '/register/legacy') {
          const host = req.headers.host || 'mcp.yarnnn.com';
          const registerResponse: any = {
            success: true,
            message: oauthConfig.enabled
              ? 'Yarnnn MCP ready with OAuth 2.0 support.'
              : 'Yarnnn MCP ready. Use bearer tokens for auth.',
            body: {
              version: '2025-06-18',  // Match Claude's current protocol version
              auth: {
                type: oauthConfig.enabled ? 'oauth2' : 'bearer',
              },
              transports: {
                sse: { url: `https://${host}/sse` },
              },
            },
          };

          // Add OAuth endpoints if enabled
          if (oauthConfig.enabled) {
            registerResponse.body.auth.oauth2 = {
              authorization_endpoint: `https://${host}/authorize`,
              token_endpoint: `https://${host}/token`,
            };
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(registerResponse, null, 2));
          return;
        }

        if (url === '/' && (req.method === 'GET' || req.method === 'POST')) {
          console.log('[HTTP] Root endpoint hit:', {
            method: req.method,
            headers: req.headers,
            userAgent: req.headers['user-agent'],
          });

          // If it's a GET with SSE accept header, redirect to SSE endpoint
          if (req.method === 'GET') {
            const acceptHeader = req.headers['accept'] || '';
            if (acceptHeader.includes('text/event-stream')) {
              console.log('[SSE] Client requesting SSE at root, establishing SSE connection');

              // Validate OAuth token before establishing SSE
              if (oauthConfig.enabled) {
                const authHeader = req.headers['authorization'];
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                  console.log('[SSE] Rejected: missing authorization header');
                  res.writeHead(401, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'missing_authorization' }));
                  return;
                }

                const token = authHeader.substring(7);
                const session = await validateOAuthToken(token, oauthConfig);

                if (!session) {
                  console.log('[SSE] Rejected: invalid token');
                  res.writeHead(401, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'invalid_token' }));
                  return;
                }

                console.log('[OAuth] SSE connection authorized at root:', {
                  userId: session.userId,
                  workspaceId: session.workspaceId,
                });
              }

              // Establish SSE connection (server.connect() calls transport.start() automatically)
              const transport = new SSEServerTransport('/message', res);
              await server.connect(transport);
              console.log(`[SSE] Session established at root: ${transport.sessionId}`);
              return;
            }
          }

          // If it's a POST, try to parse it as MCP JSON-RPC request
          if (req.method === 'POST') {
            let body = '';
            for await (const chunk of req) {
              body += chunk.toString();
            }
            console.log('[HTTP] POST body:', body);

            // Parse the MCP JSON-RPC request
            let rpcRequest: any = {};
            try {
              if (body) {
                rpcRequest = JSON.parse(body);
              }
            } catch (e) {
              console.log('[HTTP] Failed to parse body as JSON');
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
              return;
            }

            // Check if this is a JSON-RPC request (has jsonrpc field)
            if (rpcRequest.jsonrpc === '2.0' && rpcRequest.method === 'initialize') {
              console.log('[MCP] Received initialize request');

              // Check for OAuth token in Authorization header
              const authHeader = req.headers['authorization'];
              if (oauthConfig.enabled && (!authHeader || !authHeader.startsWith('Bearer '))) {
                console.log('[MCP] No OAuth token, returning 401 with OAuth challenge');

                // Return 401 Unauthorized with proper OAuth challenge (RFC 6750 + MCP spec)
                const authzEndpoint = `https://${req.headers.host}/authorize`;
                const tokenEndpoint = `https://${req.headers.host}/token`;

                res.writeHead(401, {
                  'Content-Type': 'application/json',
                  'WWW-Authenticate': `Bearer realm="YARNNN MCP", authorization_uri="${authzEndpoint}", token_uri="${tokenEndpoint}", scope="mcp:*"`
                });
                res.end(JSON.stringify({
                  jsonrpc: '2.0',
                  error: {
                    code: -32001,
                    message: 'Authentication required',
                    data: {
                      type: 'oauth2',
                      authorization_endpoint: authzEndpoint,
                      token_endpoint: tokenEndpoint,
                    }
                  },
                  id: rpcRequest.id
                }));
                console.log('[MCP] Sent 401 with OAuth endpoints:', { authzEndpoint, tokenEndpoint });
                return;
              }

              // If we have auth, return successful initialize for non-SSE clients
              // However, this should not happen - clients should use /sse
              console.log('[MCP] Client authenticated with Bearer token via POST');
              console.log('[MCP] WARNING: Expected SSE connection, got HTTP POST instead');
              // Generate session ID for Streamable HTTP transport
              const sessionId = `mcp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
              console.log('[MCP] Generated session ID:', sessionId);

              const initResponse = {
                jsonrpc: '2.0',
                result: {
                  protocolVersion: '2025-06-18',
                  capabilities: {
                    tools: {
                      listChanged: false,
                    },
                  },
                  serverInfo: {
                    name: 'yarnnn-mcp-server',
                    version: '1.0.0',
                  },
                },
                id: rpcRequest.id,
              };

              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Mcp-Session-Id': sessionId,
              });
              res.end(JSON.stringify(initResponse));
              return;
            }

            // Handle other JSON-RPC MCP methods via HTTP POST
            if (rpcRequest.jsonrpc === '2.0' && rpcRequest.method) {
              // Validate OAuth token
              const authHeader = req.headers['authorization'];
              if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  jsonrpc: '2.0',
                  error: { code: -32001, message: 'Authentication required' },
                  id: rpcRequest.id,
                }));
                return;
              }

              const token = authHeader.substring(7);
              const session = await validateOAuthToken(token, oauthConfig);

              if (!session) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  jsonrpc: '2.0',
                  error: { code: -32001, message: 'Invalid token' },
                  id: rpcRequest.id,
                }));
                return;
              }

              console.log('[MCP HTTP] Handling method:', rpcRequest.method, 'for user:', session.userId);

              // Handle tools/list
              if (rpcRequest.method === 'tools/list') {
                const toolsList = await getToolsList();
                console.log('[MCP HTTP] Returning tools list:', {
                  count: toolsList.length,
                  tools: toolsList.map(t => t.name)
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  jsonrpc: '2.0',
                  result: {
                    tools: toolsList,
                  },
                  id: rpcRequest.id,
                }));
                return;
              }

              // Handle tools/call
              if (rpcRequest.method === 'tools/call') {
                try {
                  const { name, arguments: args } = rpcRequest.params;
                  console.log('[MCP HTTP] Calling tool:', name, 'with args:', args);

                  // Create user context from session
                  const userContext: UserContext = {
                    userId: session.userId,
                    workspaceId: session.workspaceId,
                  };

                  // Create YARNNN client with OAuth session context
                  const yarnnnClient = new YARNNNClient({
                    baseUrl: config.backendUrl,
                    userContext,
                    userToken: session.supabaseToken,
                  });

                  // Execute tool
                  const result = await executeTool(name, args || {}, yarnnnClient);

                  console.log('[MCP HTTP] Tool executed successfully:', name);

                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({
                    jsonrpc: '2.0',
                    result: {
                      content: [
                        {
                          type: 'text',
                          text: JSON.stringify(result, null, 2),
                        },
                      ],
                    },
                    id: rpcRequest.id,
                  }));
                  return;
                } catch (err: any) {
                  console.error('[MCP HTTP] Tool execution failed:', err);

                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({
                    jsonrpc: '2.0',
                    error: {
                      code: -32603,
                      message: err.message || 'Tool execution failed',
                    },
                    id: rpcRequest.id,
                  }));
                  return;
                }
              }

              // Handle notifications/initialized (no response needed)
              if (rpcRequest.method === 'notifications/initialized') {
                console.log('[MCP HTTP] Client initialized');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ jsonrpc: '2.0', result: {} }));
                return;
              }

              // Unknown method
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                jsonrpc: '2.0',
                error: {
                  code: -32601,
                  message: `Method not found: ${rpcRequest.method}`,
                },
                id: rpcRequest.id,
              }));
              return;
            }

            // Not a recognized MCP request, fall through to status response
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify(
              {
                status: 'ok',
                message: 'Yarnnn MCP server ready.',
                oauth_enabled: oauthConfig.enabled,
                endpoints: {
                  authorize: `https://${req.headers.host}/authorize`,
                  token: `https://${req.headers.host}/token`,
                  sse: `https://${req.headers.host}/sse`,
                },
              },
              null,
              2
            )
          );
          return;
        }

        // GET /sse - Establish SSE connection
        if (req.method === 'GET' && url === '/sse') {
          console.log('[SSE] Connection attempt:', {
            hasAuth: !!req.headers['authorization'],
            userAgent: req.headers['user-agent'],
            accept: req.headers['accept']
          });

          // If OAuth is enabled, validate the token before establishing SSE
          if (oauthConfig.enabled) {
            const authHeader = req.headers['authorization'];
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
              console.log('[SSE] Rejected: missing authorization header');
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'missing_authorization' }));
              return;
            }

            const token = authHeader.substring(7); // Remove 'Bearer ' prefix
            const session = await validateOAuthToken(token, oauthConfig);

            if (!session) {
              console.log('[SSE] Rejected: invalid token');
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'invalid_token' }));
              return;
            }

            console.log('[OAuth] SSE connection authorized:', {
              userId: session.userId,
              workspaceId: session.workspaceId,
            });
          }

          const transport = new SSEServerTransport('/message', res);

          // Store transport by session ID for routing POST messages
          sseTransports.set(transport.sessionId, transport);

          // Cleanup on close
          transport.onclose = () => {
            sseTransports.delete(transport.sessionId);
            console.log(`[SSE] Session closed: ${transport.sessionId}`);
          };

          try {
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

        // DELETE / - Handle session cleanup (Claude.ai sends this to disconnect)
        if (req.method === 'DELETE' && url === '/') {
          const sessionId = req.headers['mcp-session-id'] as string;

          if (sessionId && sseTransports.has(sessionId)) {
            sseTransports.delete(sessionId);
            console.log(`[SSE] Session deleted via DELETE: ${sessionId}`);
          } else {
            console.log(`[SSE] DELETE request for session (may not exist yet): ${sessionId}`);
          }

          // Always return 204 No Content (idempotent operation)
          res.writeHead(204);
          res.end();
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
