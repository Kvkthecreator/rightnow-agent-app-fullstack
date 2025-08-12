import { api } from './client';

export async function getBasket(id: string): Promise<any> {
  return api.get(`/api/baskets/${id}`);
}
export async function listDeltas(id: string, since?: string): Promise<any[]> {
  const qs = since ? `?since_created_at=${encodeURIComponent(since)}` : '';
  return api.get(`/api/baskets/${id}/deltas${qs}`);
}
export async function createBasket(payload: { intent?: string; status?: string }) {
  try {
    return await api.post(`/api/baskets/new`, payload);
  } catch {
    return await api.post(`/api/baskets/`, payload);
  }
}
export async function processBasketWork(id: string, data: any) {
  return api.post(`/api/baskets/${id}/work`, data);
}
export async function applyBasketDelta(id: string, deltaId: string) {
  return api.post(`/api/baskets/${id}/apply/${deltaId}`);
}
