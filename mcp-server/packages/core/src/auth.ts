import type { UserContext } from './types/index.js';

interface SessionValidationResponse {
  supabase_token: string;
  workspace_id: string;
  user_id: string;
  expires_at: string;
}

/**
 * Validate MCP OAuth token against YARNNN backend
 *
 * OAuth 2.0 Flow:
 * - User authorizes via /auth/mcp/authorize (Supabase login)
 * - MCP server exchanges auth code for access token at /auth/mcp/token
 * - Access token validated here via /api/mcp/auth/sessions/validate
 * - Returns user context (workspace-scoped)
 */
export async function validateAuth(baseUrl: string, mcpToken: string): Promise<UserContext> {
  if (!mcpToken) {
    throw new Error('Missing MCP OAuth token - user must authorize via OAuth flow');
  }

  try {
    // Validate MCP OAuth token (RFC 6749 compliant)
    const response = await fetch(`${baseUrl}/api/mcp/auth/sessions/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mcp_token: mcpToken }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OAuth token validation failed: ${response.status} ${errorText}`);
    }

    const data = await response.json() as SessionValidationResponse;

    if (!data.user_id || !data.workspace_id) {
      throw new Error('Invalid OAuth session response from backend');
    }

    return {
      userId: data.user_id,
      workspaceId: data.workspace_id,
      basketId: undefined, // Basket is dynamically inferred per request
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`OAuth authentication failed: ${error.message}`);
    }
    throw new Error('OAuth authentication failed: Unknown error');
  }
}

/**
 * Extract user token from MCP request context
 *
 * MCP Protocol: Token should be passed in request meta
 */
export function extractToken(requestMeta?: Record<string, any>): string {
  if (!requestMeta?.user_token) {
    throw new Error('user_token not found in request context. Please provide authentication token.');
  }
  return requestMeta.user_token as string;
}
