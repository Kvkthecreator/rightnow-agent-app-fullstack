/**
 * Legacy API wrapper for server-side API routes only
 * Client-side code should use @/lib/api/client instead
 */

/**
 * @deprecated For server-side API routes only
 */
export function apiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    console.error("Missing NEXT_PUBLIC_API_BASE_URL in environment variables");
    throw new Error("Missing API base URL");
  }
  return `${baseUrl}/api${path}`;
}

/**
 * @deprecated For server-side API routes only
 */
export function apiFetch(path: string, options: RequestInit = {}) {
  return fetch(apiUrl(path), options);
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://rightnow-api.onrender.com';