import { apiClient, timeoutSignal } from './http';
import {
  BasketSchema,
  PaginatedSchema,
  CreateBasketRequestSchema,
  type Basket,
  type Paginated,
  type CreateBasketRequest,
} from './contracts';

/**
 * Basket API functions with Zod validation
 */

// Get single basket
export async function getBasket(basketId: string): Promise<Basket> {
  const response = await apiClient({
    url: `/api/baskets/${basketId}`,
    method: 'GET',
    signal: timeoutSignal(10000),
  });
  
  return BasketSchema.parse(response);
}

// List baskets with cursor pagination
export async function listBaskets(options?: {
  after_created_at?: string;
  after_id?: string;
  limit?: number;
}): Promise<Paginated<Basket>> {
  const params = new URLSearchParams();
  
  if (options?.after_created_at) {
    params.set('after_created_at', options.after_created_at);
  }
  if (options?.after_id) {
    params.set('after_id', options.after_id);
  }
  if (options?.limit) {
    params.set('limit', options.limit.toString());
  }
  
  const url = `/api/baskets${params.toString() ? `?${params}` : ''}`;
  
  const response = await apiClient({
    url,
    method: 'GET',
    signal: timeoutSignal(10000),
  });
  
  return PaginatedSchema(BasketSchema).parse(response);
}

// Create new basket
export async function createBasket(request: CreateBasketRequest): Promise<Basket> {
  // Validate request payload
  const validatedRequest = CreateBasketRequestSchema.parse(request);
  
  const response = await apiClient({
    url: '/api/baskets',
    method: 'POST',
    body: validatedRequest,
    signal: timeoutSignal(15000),
  });
  
  return BasketSchema.parse(response);
}

// Update basket
export async function updateBasket(
  basketId: string,
  updates: Partial<Pick<Basket, 'name' | 'status' | 'tags'>>
): Promise<Basket> {
  const response = await apiClient({
    url: `/api/baskets/${basketId}`,
    method: 'PATCH',
    body: updates,
    signal: timeoutSignal(10000),
  });
  
  return BasketSchema.parse(response);
}

// Delete basket
export async function deleteBasket(basketId: string): Promise<void> {
  await apiClient({
    url: `/api/baskets/${basketId}`,
    method: 'DELETE',
    signal: timeoutSignal(10000),
  });
}