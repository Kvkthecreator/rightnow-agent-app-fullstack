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
import { validateAuth, extractToken } from './auth.js';
import { YARNNNClient } from './client.js';
import { getToolsList, executeTool } from './tools/index.js';

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
        const userContext = await validateAuth(userToken);

        console.log(`[AUTH] User authenticated:`, {
          userId: userContext.userId,
          workspaceId: userContext.workspaceId,
          basketId: userContext.basketId || 'none',
        });

        // Create YARNNN client
        const client = new YARNNNClient(userContext, userToken);

        // Execute tool
        const toolName = request.params.name;
        const toolInput = request.params.arguments || {};

        console.log(`[TOOL] Executing: ${toolName}`, toolInput);

        const result = await executeTool(toolName, toolInput, client);

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
      const transport = new SSEServerTransport('/sse', {
        endpoint: `http://0.0.0.0:${config.port}`,
      });
      await server.connect(transport);
      console.log(`[SERVER] MCP server running on http://0.0.0.0:${config.port}`);
    }

    /**
     * Graceful shutdown
     */
    const shutdown = async () => {
      console.log('[SERVER] Shutting down gracefully...');
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

// Start server
main().catch((error) => {
  console.error('[FATAL] Unhandled error:', error);
  process.exit(1);
});
