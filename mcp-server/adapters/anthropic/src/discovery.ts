/**
 * OAuth and MCP discovery endpoints
 *
 * Provides .well-known metadata for OAuth 2.0 and MCP protocol discovery
 */

/**
 * OAuth 2.0 Authorization Server Metadata (RFC 8414)
 *
 * @param host - Request host header
 * @returns Authorization server metadata object
 */
export function getOAuthAuthorizationServerMetadata(host: string) {
  return {
    issuer: `https://${host}`,
    authorization_endpoint: `https://${host}/authorize`,
    token_endpoint: `https://${host}/token`,
    registration_endpoint: `https://${host}/register`, // RFC 7591 dynamic client registration
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
    scopes_supported: ['mcp:*'],
    code_challenge_methods_supported: ['S256'], // PKCE support
  };
}

/**
 * OAuth 2.0 Protected Resource Metadata (RFC 9728)
 *
 * @param host - Request host header
 * @returns Protected resource metadata object
 */
export function getOAuthProtectedResourceMetadata(host: string) {
  return {
    resource: `https://${host}`,
    authorization_servers: [`https://${host}`],
    scopes_supported: ['mcp:*'],
    bearer_methods_supported: ['header'],
  };
}

/**
 * MCP Discovery Document
 *
 * @param host - Request host header
 * @param oauthEnabled - Whether OAuth is enabled
 * @returns MCP discovery document
 */
export function getMcpDiscoveryDocument(host: string, oauthEnabled: boolean) {
  const discovery: any = {
    version: '2025-06-18',  // Match Claude's current protocol version
    serverInfo: {
      name: 'yarnnn-mcp-server',
      version: '1.0.0',
      title: 'YARNNN MCP Server',
    },
    transports: {
      streamableHttp: {
        url: `https://${host}/`,
      },
    },
    auth: {
      type: oauthEnabled ? 'oauth2' : 'bearer',
    },
  };

  // Add OAuth endpoints if enabled
  if (oauthEnabled) {
    discovery.auth.oauth2 = {
      authorization_endpoint: `https://${host}/authorize`,
      token_endpoint: `https://${host}/token`,
      registration_endpoint: `https://${host}/register`, // RFC 7591 dynamic client registration
      // Note: Static clients can use client_id "yarnnn-mcp-anthropic" directly
      // Dynamic clients should register first via /register endpoint
    };
  }

  return discovery;
}
