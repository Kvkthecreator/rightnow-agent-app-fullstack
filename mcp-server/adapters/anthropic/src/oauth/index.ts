/**
 * OAuth 2.0 implementation for Claude.ai remote MCP connector
 *
 * This adapter delegates all OAuth operations to the backend authorization server.
 * Backend is the single source of truth for authorization, tokens, and session storage.
 */

// Configuration
export { getOAuthConfig } from './config.js';
export type { OAuthConfig } from './config.js';

// Handlers - MCP adapter proxies requests to backend
export { handleAuthorize, handleTokenExchange, handleClientRegistration } from './handlers.js';

// Validation - validates tokens via backend
export { validateOAuthToken } from './validation.js';

// Types
export type { AuthorizationRequest, TokenRequest } from './types.js';
