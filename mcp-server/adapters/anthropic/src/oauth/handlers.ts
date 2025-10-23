/**
 * OAuth authorization flow handlers
 */

import { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import type { OAuthConfig } from './config.js';
import type { AuthorizationRequest, TokenRequest } from './types.js';
import { generateToken, storeAuthCode, consumeAuthCode } from './tokens.js';

/**
 * Handle GET /authorize - OAuth authorization endpoint
 *
 * Claude.ai redirects here when user enables the connector.
 * Immediately redirects to YARNNN web app for authentication.
 */
export async function handleAuthorize(
  req: IncomingMessage,
  res: ServerResponse,
  config: OAuthConfig
): Promise<void> {
  if (!config.enabled) {
    res.writeHead(501, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'oauth_not_enabled' }));
    return;
  }

  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const params: AuthorizationRequest = {
    response_type: url.searchParams.get('response_type') || '',
    client_id: url.searchParams.get('client_id') || '',
    redirect_uri: url.searchParams.get('redirect_uri') || '',
    state: url.searchParams.get('state') || '',
    scope: url.searchParams.get('scope') || undefined,
  };

  console.log('[OAuth] Authorization request:', params);

  // Validate required OAuth parameters
  if (params.response_type !== 'code') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'unsupported_response_type' }));
    return;
  }

  if (!params.redirect_uri || !params.state) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'invalid_request' }));
    return;
  }

  // Check if client_id matches (optional, for added security)
  if (config.clientId && params.client_id !== config.clientId) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'invalid_client' }));
    return;
  }

  // Immediately redirect to YARNNN web app for auth (no intermediate HTML page)
  const authorizationUrl = `https://yarnnn.com/mcp/authorize?` +
    `redirect_uri=${encodeURIComponent(params.redirect_uri)}&` +
    `state=${encodeURIComponent(params.state)}&` +
    `scope=${encodeURIComponent(params.scope || 'mcp:*')}&` +
    `mcp_callback=${encodeURIComponent(`https://${req.headers.host}/oauth/callback`)}`;

  console.log('[OAuth] Redirecting to YARNNN authorization page:', authorizationUrl);

  res.writeHead(302, { 'Location': authorizationUrl });
  res.end();
}

/**
 * Handle GET /oauth/callback - OAuth callback from YARNNN web app
 *
 * After user authenticates in YARNNN web app, they're redirected here
 * with their Supabase token. We generate an OAuth code and redirect to Claude.
 */
export async function handleOAuthCallback(
  req: IncomingMessage,
  res: ServerResponse,
  config: OAuthConfig
): Promise<void> {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const supabaseToken = url.searchParams.get('token');
  const userId = url.searchParams.get('user_id');
  const workspaceId = url.searchParams.get('workspace_id');
  const redirectUri = url.searchParams.get('redirect_uri');
  const state = url.searchParams.get('state');

  console.log('[OAuth] Callback received:', { userId, workspaceId, hasToken: !!supabaseToken });

  if (!supabaseToken || !userId || !workspaceId || !redirectUri || !state) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<h1>Invalid callback parameters</h1>');
    return;
  }

  // Generate authorization code
  const code = generateToken('ac');  // ac = authorization code
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

  storeAuthCode(code, {
    supabaseToken,
    userId,
    workspaceId,
    expiresAt,
  });

  console.log('[OAuth] Authorization code generated:', code);

  // Redirect back to Claude with code and state
  const claudeRedirectUrl = new URL(redirectUri);
  claudeRedirectUrl.searchParams.set('code', code);
  claudeRedirectUrl.searchParams.set('state', state);

  res.writeHead(302, { 'Location': claudeRedirectUrl.toString() });
  res.end();
}

/**
 * Handle POST /token - OAuth token exchange endpoint
 *
 * Claude.ai exchanges the authorization code for an access token.
 * We validate the code and return a token that maps to the user's Supabase session.
 */
export async function handleTokenExchange(
  req: IncomingMessage,
  res: ServerResponse,
  config: OAuthConfig
): Promise<void> {
  if (!config.enabled) {
    res.writeHead(501, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'oauth_not_enabled' }));
    return;
  }

  // Read request body
  let body = '';
  for await (const chunk of req) {
    body += chunk.toString();
  }

  let params: TokenRequest;
  const contentType = req.headers['content-type'] || '';

  if (contentType.includes('application/json')) {
    params = JSON.parse(body);
  } else {
    // Parse URL-encoded form data
    const searchParams = new URLSearchParams(body);
    params = {
      grant_type: searchParams.get('grant_type') || '',
      code: searchParams.get('code') || '',
      redirect_uri: searchParams.get('redirect_uri') || '',
      client_id: searchParams.get('client_id') || '',
      client_secret: searchParams.get('client_secret') || undefined,
    };
  }

  console.log('[OAuth] Token exchange request:', { grant_type: params.grant_type, code: params.code?.substring(0, 10) + '...' });

  // Validate grant type
  if (params.grant_type !== 'authorization_code') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'unsupported_grant_type' }));
    return;
  }

  // Validate client credentials (if configured)
  if (config.clientSecret) {
    if (params.client_secret !== config.clientSecret) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid_client' }));
      return;
    }
  }

  // Look up and consume authorization code
  const authData = consumeAuthCode(params.code);
  if (!authData) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'invalid_grant', error_description: 'Code expired or already used' }));
    return;
  }

  // Generate access token with long expiration for MCP servers
  // MCP servers should have long-lived tokens (90 days) since they're not browser-based
  // and users don't want to re-authenticate frequently for AI assistants
  const accessToken = generateToken('yat'); // yat = YARNNN access token

  // Store in backend (single source of truth)
  try {
    const response = await fetch(`${config.backendUrl}/api/mcp/auth/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.supabaseToken}`,
      },
      body: JSON.stringify({
        mcp_token: accessToken,
        supabase_token: authData.supabaseToken,
        user_id: authData.userId,
        expires_in_days: 90,
      }),
    });

    if (!response.ok) {
      console.error('[OAuth] Failed to persist session to backend:', response.status);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'failed_to_create_session' }));
      return;
    }
  } catch (error) {
    console.error('[OAuth] Failed to persist session to backend:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'backend_unavailable' }));
    return;
  }

  console.log('[OAuth] Access token issued (90-day expiration):', accessToken.substring(0, 10) + '...');

  // Return token response
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 7776000, // 90 days in seconds
    scope: params.scope || 'full_access',
  }));
}
