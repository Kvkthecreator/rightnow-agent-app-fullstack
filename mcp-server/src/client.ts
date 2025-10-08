import { config } from './config.js';
import type { UserContext, YARNNNError } from './types/index.js';

/**
 * HTTP client wrapper for YARNNN backend API calls
 *
 * YARNNN Architecture:
 * - FastAPI backend at BACKEND_URL
 * - Workspace-scoped security via Authorization header
 * - All responses follow canonical error format
 */

interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

export class YARNNNClient {
  private baseUrl: string;
  private userContext: UserContext;
  private userToken: string;

  constructor(userContext: UserContext, userToken: string) {
    this.baseUrl = config.backendUrl;
    this.userContext = userContext;
    this.userToken = userToken;
  }

  /**
   * Make authenticated request to YARNNN backend
   */
  async request<T>(endpoint: string, options: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.userToken}`,
      'Content-Type': 'application/json',
      'X-Workspace-ID': this.userContext.workspaceId,
      ...options.headers,
    };

    // Add basket context if available
    if (this.userContext.basketId) {
      headers['X-Basket-ID'] = this.userContext.basketId;
    }

    try {
      const response = await fetch(url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      // Handle error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          code: 'HTTP_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));

        throw new YARNNNAPIError(
          errorData.code || 'API_ERROR',
          errorData.message || 'Request failed',
          errorData.details
        );
      }

      // Parse successful response
      return await response.json();
    } catch (error) {
      if (error instanceof YARNNNAPIError) {
        throw error;
      }

      // Network or parsing errors
      throw new YARNNNAPIError(
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Network request failed',
        { endpoint, method: options.method }
      );
    }
  }

  /**
   * GET request helper
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request<T>(endpoint + queryString, { method: 'GET' });
  }

  /**
   * POST request helper
   */
  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  /**
   * PATCH request helper
   */
  async patch<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  /**
   * DELETE request helper
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

/**
 * Custom error class for YARNNN API errors
 */
export class YARNNNAPIError extends Error implements YARNNNError {
  code: string;
  details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'YARNNNAPIError';
    this.code = code;
    this.details = details;

    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, YARNNNAPIError);
    }
  }

  toJSON(): YARNNNError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}
