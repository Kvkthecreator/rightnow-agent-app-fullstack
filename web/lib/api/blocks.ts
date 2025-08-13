import { apiClient, timeoutSignal } from './http';
import {
  BlockSchema,
  PaginatedSchema,
  UpdateBlockRequestSchema,
  type Block,
  type Paginated,
  type UpdateBlockRequest,
} from './contracts';

/**
 * Block API functions with Zod validation
 */

// Get single block
export async function getBlock(blockId: string): Promise<Block> {
  const response = await apiClient({
    url: `/api/blocks/${blockId}`,
    method: 'GET',
    signal: timeoutSignal(10000),
  });
  
  return BlockSchema.parse(response);
}

// List blocks for a basket with cursor pagination
export async function listBlocks(basketId: string, options?: {
  after_created_at?: string;
  after_id?: string;
  limit?: number;
  status?: 'proposed' | 'accepted' | 'rejected';
}): Promise<Paginated<Block>> {
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
  if (options?.status) {
    params.set('status', options.status);
  }
  
  const response = await apiClient({
    url: `/api/blocks?${params}`,
    method: 'GET',
    signal: timeoutSignal(10000),
  });
  
  return PaginatedSchema(BlockSchema).parse(response);
}

// Accept block
export async function acceptBlock(blockId: string): Promise<Block> {
  const response = await apiClient({
    url: `/api/blocks/${blockId}/accept`,
    method: 'POST',
    signal: timeoutSignal(10000),
  });
  
  // Extract the block from the response wrapper
  const responseData = response as { success: boolean; block: unknown };
  return BlockSchema.parse(responseData.block);
}

// Reject block
export async function rejectBlock(blockId: string): Promise<Block> {
  const response = await apiClient({
    url: `/api/blocks/${blockId}/reject`,
    method: 'POST',
    signal: timeoutSignal(10000),
  });
  
  // Extract the block from the response wrapper
  const responseData = response as { success: boolean; block: unknown };
  return BlockSchema.parse(responseData.block);
}

// Update block (title, content, etc.)
export async function updateBlock(
  blockId: string,
  updates: UpdateBlockRequest
): Promise<Block> {
  // Validate request payload
  const validatedUpdates = UpdateBlockRequestSchema.parse(updates);
  
  const response = await apiClient({
    url: `/api/blocks/${blockId}`,
    method: 'PATCH',
    body: validatedUpdates,
    signal: timeoutSignal(10000),
  });
  
  return BlockSchema.parse(response);
}