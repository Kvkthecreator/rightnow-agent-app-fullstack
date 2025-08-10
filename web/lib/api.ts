/**
 * Legacy API wrapper - migrate to centralized ApiClient
 * @deprecated Use @/lib/api/client instead
 */
import { apiClient } from './api/client';

/**
 * @deprecated Use apiClient.request() instead
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
 * @deprecated Use apiClient.request() instead
 */
export function apiFetch(path: string, options: RequestInit = {}) {
  return fetch(apiUrl(path), options);
}

/**
 * @deprecated Use apiClient.request() instead
 */
export async function apiGet<T = any>(path: string, token?: string): Promise<T> {
  return apiClient.request(`/api${path}`, { method: 'GET' });
}

/**
 * @deprecated Use apiClient.request() instead
 */
export async function apiPost<T = any>(
  path: string,
  body: any,
  token?: string,
): Promise<T> {
  return apiClient.request(`/api${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * @deprecated Use apiClient.request() instead
 */
export async function apiPut<T = any>(
  path: string,
  body: any,
  token?: string,
): Promise<T> {
  return apiClient.request(`/api${path}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * @deprecated Use apiClient.request() instead
 */
export async function apiDelete<T = any>(path: string, token?: string): Promise<T> {
  return apiClient.request(`/api${path}`, { method: 'DELETE' });
}
