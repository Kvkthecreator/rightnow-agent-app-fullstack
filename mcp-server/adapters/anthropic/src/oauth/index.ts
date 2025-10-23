/**
 * OAuth 2.0 implementation for Claude.ai remote MCP connector
 *
 * This module provides a complete OAuth 2.0 authorization flow integrated
 * with YARNNN's Supabase authentication system.
 */

// Configuration
export { getOAuthConfig } from './config.js';
export type { OAuthConfig } from './config.js';

// Handlers
export { handleAuthorize, handleOAuthCallback, handleTokenExchange } from './handlers.js';
export { handleDynamicClientRegistration } from './client-registration.js';

// Validation
export { validateOAuthToken } from './validation.js';

// Types
export type { AuthorizationRequest, TokenRequest, AuthCodeData } from './types.js';
