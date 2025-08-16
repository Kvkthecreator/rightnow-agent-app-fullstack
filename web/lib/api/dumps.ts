import { apiClient, timeoutSignal } from './http';
import {
  RawDumpSchema,
  CreateDumpRequestSchema,
  type RawDump,
  type CreateDumpRequest,
} from './contracts';

/**
 * Raw dump API functions with Zod validation
 */

// Create new raw dump
export async function createDump(
  request: Omit<CreateDumpRequest, 'dump_request_id'>,
): Promise<{
  dump_id: string;
  status: string;
  processing: string;
}> {
  const payload = { ...request, dump_request_id: crypto.randomUUID() };

  // Validate request payload
  const validatedRequest = CreateDumpRequestSchema.parse(payload);

  const response = await apiClient({
    url: '/api/dumps/new',
    method: 'POST',
    body: validatedRequest,
    signal: timeoutSignal(20000), // Longer timeout for processing
  });

  return response as {
    dump_id: string;
    status: string;
    processing: string;
  };
}

// Get raw dump by ID
export async function getRawDump(dumpId: string): Promise<RawDump> {
  const response = await apiClient({
    url: `/api/dumps/${dumpId}`,
    method: 'GET',
    signal: timeoutSignal(10000),
  });
  
  return RawDumpSchema.parse(response);
}

// List raw dumps for a basket
export async function listRawDumps(basketId: string, options?: {
  after_created_at?: string;
  after_id?: string;
  limit?: number;
  processing_status?: 'pending' | 'processing' | 'processed' | 'failed';
}): Promise<RawDump[]> {
  const params = new URLSearchParams();
  params.set('basket_id', basketId);
  
  if (options?.after_created_at) {
    params.set('after_created_at', options.after_created_at);
  }
  if (options?.after_id) {
    params.set('after_id', options.after_id);
  }
  if (options?.limit) {
    params.set('limit', options.limit.toString());
  }
  if (options?.processing_status) {
    params.set('processing_status', options.processing_status);
  }
  
  const response = await apiClient({
    url: `/api/dumps?${params}`,
    method: 'GET',
    signal: timeoutSignal(10000),
  });
  
  // Validate array response
  if (!Array.isArray(response)) {
    throw new Error('Expected array response from raw dumps API');
  }
  
  return response.map(item => RawDumpSchema.parse(item));
}