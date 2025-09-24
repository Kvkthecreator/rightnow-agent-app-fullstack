// Governed by: /docs/YARNNN_ALERTS_NOTIFICATIONS_CANON.md (v1.0)

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

export interface AppEvent {
  id?: string;
  v: number;
  type: 'job_update' | 'system_alert' | 'action_result' | 'collab_activity' | 'validation';
  name: string;
  phase?: 'started' | 'progress' | 'succeeded' | 'failed';
  severity: 'info' | 'success' | 'warning' | 'error';
  message: string;
  correlation_id?: string;
  scope?: { 
    workspace_id?: string; 
    basket_id?: string; 
    entity_id?: string; 
  };
  dedupe_key?: string;
  ttl_ms?: number;
  payload?: Record<string, any>;
  created_at?: string;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  notifications?: AppEvent[];
  correlation_id?: string;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Create a standardized API response
 */
export function apiResponse<T>(
  data: T,
  options: {
    notifications?: AppEvent[];
    correlation_id?: string;
    status?: number;
  } = {}
): NextResponse {
  const body: ApiResponse<T> = {
    ok: true,
    data,
    notifications: options.notifications,
    correlation_id: options.correlation_id,
  };

  return NextResponse.json(body, { 
    status: options.status || 200,
    headers: {
      'X-Correlation-Id': options.correlation_id || '',
    }
  });
}

/**
 * Create a standardized error response
 */
export function apiError(
  message: string,
  options: {
    code?: string;
    status?: number;
    correlation_id?: string;
    notifications?: AppEvent[];
  } = {}
): NextResponse {
  const body: ApiResponse = {
    ok: false,
    error: {
      message,
      code: options.code,
    },
    notifications: options.notifications,
    correlation_id: options.correlation_id,
  };

  return NextResponse.json(body, {
    status: options.status || 500,
    headers: {
      'X-Correlation-Id': options.correlation_id || '',
    }
  });
}

/**
 * Create a 202 Accepted response for async operations
 */
export function apiAccepted(
  job_id: string,
  options: {
    correlation_id?: string;
    message?: string;
  } = {}
): NextResponse {
  return NextResponse.json({
    ok: true,
    accepted: true,
    job_id,
    message: options.message || 'Processing started',
    correlation_id: options.correlation_id,
  }, {
    status: 202,
    headers: {
      'X-Correlation-Id': options.correlation_id || '',
    }
  });
}

/**
 * Extract or generate correlation ID from request
 */
export function getCorrelationId(request: NextRequest): string {
  return request.headers.get('X-Correlation-Id') || `req_${nanoid()}`;
}

/**
 * Wrap an API route handler with correlation ID handling
 */
export function withCorrelation<T extends (...args: any[]) => any>(
  handler: T
): T {
  return (async (request: NextRequest, ...args: any[]) => {
    const correlationId = getCorrelationId(request);
    
    // Add correlation ID to request for handler use
    (request as any).correlationId = correlationId;
    
    try {
      const response = await handler(request, ...args);
      
      // If it's already a NextResponse, add the header
      if (response instanceof NextResponse) {
        response.headers.set('X-Correlation-Id', correlationId);
        return response;
      }
      
      // Otherwise wrap it
      return apiResponse(response, { correlation_id: correlationId });
    } catch (error) {
      console.error('API Error:', error);
      return apiError(
        error instanceof Error ? error.message : 'Internal server error',
        { 
          correlation_id: correlationId,
          status: 500,
        }
      );
    }
  }) as T;
}