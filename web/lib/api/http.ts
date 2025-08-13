import { z } from 'zod';
import { ApiErrorSchema } from './contracts';
import { MockApiAdapter } from './adapters/mock';

export interface ApiRequest {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromResponse(response: Response, body?: unknown): ApiError {
    // Try to parse error from response body
    if (body && typeof body === 'object' && 'error' in body) {
      try {
        const parsed = ApiErrorSchema.parse({ ...body, status: response.status });
        return new ApiError(parsed.error, parsed.status, parsed.details, parsed.code);
      } catch {
        // Fall through to default error
      }
    }

    return new ApiError(
      response.statusText || `HTTP ${response.status}`,
      response.status,
      typeof body === 'string' ? body : undefined
    );
  }
}

// Global mock adapter instance
let mockAdapter: MockApiAdapter | null = null;

/**
 * Centralized API client with auth, workspace headers, and request tracking
 */
export async function apiClient(request: ApiRequest): Promise<unknown> {
  // Check if we're in mock mode
  const apiMode = process.env.API_MODE || process.env.NEXT_PUBLIC_API_MODE;
  if (apiMode === 'mock') {
    if (!mockAdapter) {
      mockAdapter = new MockApiAdapter();
    }
    return mockAdapter.request(request.url, { 
      method: request.method,
      body: request.body,
      url: request.url,
    });
  }
  const { url, method = 'GET', body, headers = {}, signal } = request;
  
  // Generate request ID for tracking
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  
  // Get auth token if available (in browser context)
  let authToken: string | undefined;
  if (typeof window !== 'undefined') {
    // In browser, get token from Supabase auth
    const { supabase } = await import('@/lib/supabaseClient');
    const { data: { session } } = await supabase.auth.getSession();
    authToken = session?.access_token;
  }
  
  // Get workspace ID if available
  let workspaceId: string | undefined;
  if (typeof window !== 'undefined') {
    // Try to get from local storage or context
    workspaceId = localStorage.getItem('workspace_id') || undefined;
  }
  
  // Build full URL - handle both absolute and relative URLs
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  // Prepare headers
  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-Id': requestId,
    ...headers,
  };
  
  if (authToken) {
    finalHeaders['Authorization'] = `Bearer ${authToken}`;
  }
  
  if (workspaceId) {
    finalHeaders['X-Workspace-Id'] = workspaceId;
  }
  
  // Log request in development
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[apiClient] ${method} ${url}`, {
      requestId,
      workspaceId,
      hasAuth: !!authToken,
    });
  }
  
  try {
    const response = await fetch(fullUrl, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal,
      credentials: 'include', // Include cookies for server-side auth
    });
    
    // Parse response
    let responseData: unknown;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    // Handle errors
    if (!response.ok) {
      throw ApiError.fromResponse(response, responseData);
    }
    
    // Log successful response in development
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[apiClient] ${method} ${url} → ${response.status}`, {
        requestId,
      });
    }
    
    return responseData;
    
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiError('Network error - unable to reach server', 0, 'Check your internet connection');
    }
    
    // Handle abort errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request cancelled', 0, 'The request was aborted');
    }
    
    // Re-throw API errors
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Wrap unknown errors
    throw new ApiError(
      'An unexpected error occurred',
      0,
      error instanceof Error ? error.message : String(error)
    );
  }
}

// Helper to create a timeout signal
export function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}