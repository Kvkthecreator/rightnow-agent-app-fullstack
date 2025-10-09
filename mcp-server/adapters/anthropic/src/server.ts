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
      try {
        // Extract and validate auth token
        const userToken = extractToken(request.params._meta);
        const userContext = await validateAuth(config.backendUrl, userToken);

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
        const toolName = request.params.name;
        const toolInput = request.params.arguments || {};

        console.log(`[TOOL] Executing: ${toolName}`, toolInput);

        const selection = await resolveBasketSelection(
          toolName,
          toolInput,
          client
        );

        const result = await executeTool(toolName, toolInput, client);

        if (selection) {
          (result as any)._basket_selection = selection;
        }

        console.log(`[TOOL] Success: ${toolName}`, result);

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
  toolInput: any,
  client: YARNNNClient
): Promise<BasketSelection | null> {
  const fingerprint = extractFingerprint(toolInput);
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

// Start server
main().catch((error) => {
  console.error('[FATAL] Unhandled error:', error);
  process.exit(1);
});
