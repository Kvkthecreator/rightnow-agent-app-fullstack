/**
 * OAuth 2.0 handler for Claude.ai remote MCP connector
 *
 * This integrates Claude.ai's OAuth flow with YARNNN's existing Supabase auth:
 * 1. User authorizes in Claude.ai → redirected to /authorize
 * 2. Server shows YARNNN login/consent → user logs in with Supabase
 * 3. Server generates OAuth code → redirects back to Claude with code
 * 4. Claude exchanges code for token at /token
 * 5. Server stores mapping: claude_oauth_token → supabase_user_token
 * 6. SSE/tool requests use claude_oauth_token, server looks up supabase token
 */

import { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import crypto from 'node:crypto';

interface OAuthConfig {
  backendUrl: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  enabled: boolean;
}

interface AuthorizationRequest {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  state: string;
  scope?: string;
}

interface TokenRequest {
  grant_type: string;
  code: string;
  redirect_uri: string;
  client_id: string;
  client_secret?: string;
  scope?: string;
}

// In-memory stores (replace with backend persistence for production)
const authCodes = new Map<string, {
  supabaseToken: string;
  userId: string;
  workspaceId: string;
  expiresAt: number;
}>();

const accessTokens = new Map<string, {
  supabaseToken: string;
  userId: string;
  workspaceId: string;
  expiresAt: number;
}>();

/**
 * Generate a cryptographically secure random token
 */
function generateToken(prefix: string = ''): string {
  const random = crypto.randomBytes(32).toString('base64url');
  return prefix ? `${prefix}_${random}` : random;
}

/**
 * Handle POST /oauth/register - Dynamic Client Registration (RFC 7591)
 *
 * Claude.ai uses this to dynamically register itself as an OAuth client.
 */
export async function handleDynamicClientRegistration(
  req: IncomingMessage,
  res: ServerResponse,
  config: OAuthConfig
): Promise<void> {
  if (!config.enabled) {
    res.writeHead(501, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'oauth_not_enabled' }));
    return;
  }

  // Parse request body
  let body = '';
  for await (const chunk of req) {
    body += chunk.toString();
  }

  let registrationRequest: any;
  try {
    registrationRequest = JSON.parse(body);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'invalid_client_metadata' }));
    return;
  }

  console.log('[OAuth] Dynamic client registration request:', registrationRequest);

  // Generate client credentials
  const clientId = generateToken('client');
  const clientSecret = generateToken('secret');

  // Build registration response per RFC 7591
  const registrationResponse = {
    client_id: clientId,
    client_secret: clientSecret,
    client_secret_expires_at: 0, // Never expires
    client_name: registrationRequest.client_name || 'Claude',
    redirect_uris: registrationRequest.redirect_uris || ['https://claude.ai/api/mcp/auth_callback'],
    grant_types: registrationRequest.grant_types || ['authorization_code'],
    response_types: registrationRequest.response_types || ['code'],
    token_endpoint_auth_method: 'client_secret_post',
  };

  console.log('[OAuth] Registered new client:', { clientId, clientName: registrationResponse.client_name });

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(registrationResponse, null, 2));
}

/**
 * Handle GET /authorize - OAuth authorization endpoint
 *
 * Claude.ai redirects here when user enables the connector.
 * We need to authenticate the user against YARNNN/Supabase.
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

  // Generate consent page HTML that redirects to YARNNN web app for auth
  const consentPageUrl = `https://yarnnn.com/mcp/authorize?` +
    `redirect_uri=${encodeURIComponent(params.redirect_uri)}&` +
    `state=${encodeURIComponent(params.state)}&` +
    `scope=${encodeURIComponent(params.scope || 'mcp:*')}&` +
    `mcp_callback=${encodeURIComponent(`https://${req.headers.host}/oauth/callback`)}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Connect YARNNN to Claude</title>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      max-width: 500px;
      margin: 100px auto;
      padding: 20px;
      text-align: center;
    }
    .logo { font-size: 48px; margin-bottom: 20px; }
    h1 { font-size: 24px; color: #333; }
    p { color: #666; line-height: 1.6; }
    .btn {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      margin-top: 20px;
    }
    .btn:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="logo">🧶</div>
  <h1>Connect YARNNN to Claude</h1>
  <p>You're about to authorize Claude to access your YARNNN workspace.</p>
  <p>You'll be redirected to YARNNN to sign in and grant permission.</p>
  <a href="${consentPageUrl}" class="btn">Continue to YARNNN</a>
</body>
</html>
  `;

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
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

  authCodes.set(code, {
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

  // Look up authorization code
  const authData = authCodes.get(params.code);
  if (!authData) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'invalid_grant' }));
    return;
  }

  // Check expiration
  if (Date.now() > authData.expiresAt) {
    authCodes.delete(params.code);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'invalid_grant', error_description: 'Code expired' }));
    return;
  }

  // Generate access token
  const accessToken = generateToken('yat'); // yat = YARNNN access token
  const tokenExpiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

  // Store access token mapping
  accessTokens.set(accessToken, {
    supabaseToken: authData.supabaseToken,
    userId: authData.userId,
    workspaceId: authData.workspaceId,
    expiresAt: tokenExpiresAt,
  });

  // Store in backend for persistence
  try {
    await fetch(`${config.backendUrl}/api/mcp/auth/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.supabaseToken}`,
      },
      body: JSON.stringify({
        mcp_token: accessToken,
        supabase_token: authData.supabaseToken,
        user_id: authData.userId,
      }),
    });
  } catch (error) {
    console.error('[OAuth] Failed to persist session to backend:', error);
    // Continue anyway - in-memory store will work for now
  }

  // Delete authorization code (one-time use)
  authCodes.delete(params.code);

  console.log('[OAuth] Access token issued:', accessToken.substring(0, 10) + '...');

  // Return token response
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 86400, // 24 hours in seconds
    scope: params.scope || 'full_access',
  }));
}

/**
 * Validate OAuth token and return associated Supabase session
 *
 * Called by SSE handler before establishing connection.
 */
export async function validateOAuthToken(
  token: string,
  config: OAuthConfig
): Promise<{ supabaseToken: string; userId: string; workspaceId: string } | null> {
  // Check in-memory store first
  const session = accessTokens.get(token);
  if (session) {
    if (Date.now() < session.expiresAt) {
      return {
        supabaseToken: session.supabaseToken,
        userId: session.userId,
        workspaceId: session.workspaceId,
      };
    } else {
      accessTokens.delete(token);
    }
  }

  // Fall back to backend validation
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
      // Cache in memory for faster subsequent lookups
      accessTokens.set(token, {
        supabaseToken: data.supabase_token,
        userId: data.user_id,
        workspaceId: data.workspace_id,
        expiresAt: new Date(data.expires_at).getTime(),
      });
      return {
        supabaseToken: data.supabase_token,
        userId: data.user_id,
        workspaceId: data.workspace_id,
      };
    }
  } catch (error) {
    console.error('[OAuth] Backend validation failed:', error);
  }

  return null;
}

/**
 * Get OAuth configuration from environment
 */
export function getOAuthConfig(backendUrl: string): OAuthConfig {
  return {
    backendUrl,
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    redirectUri: process.env.OAUTH_REDIRECT_URI,
    enabled: process.env.OAUTH_ENABLED === 'true',
  };
}
