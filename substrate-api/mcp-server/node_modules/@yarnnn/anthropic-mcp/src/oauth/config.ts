/**
 * OAuth configuration management
 */

export interface OAuthConfig {
  backendUrl: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  enabled: boolean;
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
