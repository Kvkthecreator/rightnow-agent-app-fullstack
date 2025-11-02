/**
 * Token validation against backend
 */

import type { OAuthConfig } from './config.js';

/**
 * Validate OAuth token and return associated Supabase session
 *
 * Always validates against backend (single source of truth).
 * This ensures consistency across multiple server instances.
 */
export async function validateOAuthToken(
  token: string,
  config: OAuthConfig
): Promise<{ supabaseToken: string; userId: string; workspaceId: string } | null> {
  try {
    const response = await fetch(`${config.backendUrl}/api/mcp/auth/sessions/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mcp_token: token }),
    });

    if (response.ok) {
      const data = await response.json() as {
        supabase_token: string;
        user_id: string;
        workspace_id: string;
        expires_at: string;
      };
      return {
        supabaseToken: data.supabase_token,
        userId: data.user_id,
        workspaceId: data.workspace_id,
      };
    }

    // Token invalid or expired
    console.log('[OAuth] Token validation failed:', response.status);
    return null;
  } catch (error) {
    console.error('[OAuth] Backend validation failed:', error);
    return null;
  }
}
