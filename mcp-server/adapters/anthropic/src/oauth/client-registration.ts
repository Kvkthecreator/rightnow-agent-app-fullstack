/**
 * Dynamic Client Registration (RFC 7591)
 */

import { IncomingMessage, ServerResponse } from 'node:http';
import type { OAuthConfig } from './config.js';
import { generateToken } from './tokens.js';

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
