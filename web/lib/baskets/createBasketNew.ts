import { apiPost } from '@/lib/api';

export interface NewBasketArgs {
  text: string;
  files?: string[];
  name?: string | null;
}

export async function createBasketNew(args: NewBasketArgs): Promise<{ id: string }> {
  return apiPost('/api/baskets/new', args);
}
