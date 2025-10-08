import { config } from './config.js';
import type { UserContext, AuthValidationResponse } from './types/index.js';

/**
 * Validate user authentication token against YARNNN backend
 *
 * YARNNN Auth Canon:
 * - Uses Supabase JWT tokens
 * - Workspace-scoped security (single workspace per user)
 * - All access via RLS policies on workspace_memberships
 */
export async function validateAuth(userToken: string): Promise<UserContext> {
  if (!userToken) {
    throw new Error('Missing user_token in MCP context');
  }

  try {
    // Call YARNNN backend auth validation endpoint
    const response = await fetch(`${config.backendUrl}/api/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Auth validation failed: ${response.status} ${errorText}`);
    }

    const data: AuthValidationResponse = await response.json();

    if (!data.valid || !data.user_id || !data.workspace_id) {
      throw new Error('Invalid authentication response from backend');
    }

    return {
      userId: data.user_id,
      workspaceId: data.workspace_id,
      basketId: data.basket_id,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
    throw new Error('Authentication failed: Unknown error');
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
