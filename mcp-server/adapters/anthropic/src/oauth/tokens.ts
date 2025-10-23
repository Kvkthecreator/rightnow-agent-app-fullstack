/**
 * Token generation and storage utilities
 */

import crypto from 'node:crypto';
import type { AuthCodeData } from './types.js';

// In-memory authorization codes (short-lived, 10 minutes)
// These are kept in-memory only as they're single-use and expire quickly
const authCodes = new Map<string, AuthCodeData>();

/**
 * Generate a cryptographically secure random token
 */
export function generateToken(prefix: string = ''): string {
  const random = crypto.randomBytes(32).toString('base64url');
  return prefix ? `${prefix}_${random}` : random;
}

/**
 * Store authorization code (10 minute expiration)
 */
export function storeAuthCode(code: string, data: AuthCodeData): void {
  authCodes.set(code, data);
}

/**
 * Retrieve and delete authorization code (one-time use)
 */
export function consumeAuthCode(code: string): AuthCodeData | null {
  const data = authCodes.get(code);
  if (!data) {
    return null;
  }

  // Check expiration
  if (Date.now() > data.expiresAt) {
    authCodes.delete(code);
    return null;
  }

  // Delete after use (one-time use)
  authCodes.delete(code);
  return data;
}
