/**
 * OAuth authorization flow handlers
 *
 * This adapter delegates all OAuth operations to the backend authorization server.
 * Backend handles: authorization, consent, code generation, token exchange, session storage.
 */

import { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import type { OAuthConfig } from './config.js';

/**
 * Handle GET /authorize - OAuth authorization endpoint
 *
 * Claude.ai redirects here when user enables the connector.
 * Delegates to backend OAuth authorization endpoint.
 *
 * Flow: MCP /authorize → Backend /auth/mcp/authorize → User consent → Backend redirect to Claude
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
  const queryString = url.search; // Preserve all query parameters

  // Redirect to backend OAuth authorization endpoint
  // Backend handles: user auth, consent screen, code generation, direct redirect to Claude
  const backendAuthUrl = `${config.backendUrl}/api/auth/mcp/authorize${queryString}`;

  console.log('[OAuth] Proxying authorization to backend:', backendAuthUrl);

  res.writeHead(302, { 'Location': backendAuthUrl });
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

  console.log('[OAuth] Token exchange request - proxying to backend');

  // Proxy token exchange request to backend
  // Backend handles: code validation, token generation, session storage
  try {
    const backendResponse = await fetch(`${config.backendUrl}/api/auth/mcp/token`, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/x-www-form-urlencoded',
      },
      body,
    });

    const responseBody = await backendResponse.text();

    // Forward backend response to client
    res.writeHead(backendResponse.status, {
      'Content-Type': 'application/json',
    });
    res.end(responseBody);

    if (backendResponse.ok) {
      const tokenData = JSON.parse(responseBody);
      console.log('[OAuth] Access token issued:', tokenData.access_token.substring(0, 10) + '...');
    } else {
      console.error('[OAuth] Token exchange failed:', backendResponse.status, responseBody);
    }
  } catch (error) {
    console.error('[OAuth] Backend token exchange failed:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'server_error',
      error_description: 'Backend OAuth service unavailable'
    }));
  }
}
