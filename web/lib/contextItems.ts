import { apiPost, apiPut, apiDelete } from './api';

export interface ContextItemPayload {
  basket_id?: string;
  document_id?: string | null;
  type: string;
  summary: string;
  status?: string;
}

export function createContextItem(body: ContextItemPayload) {
  return apiPost('/api/context_items', body);
}

export function updateContextItem(id: string, body: Partial<ContextItemPayload>) {
  return apiPut(`/api/context_items/${id}`, body);
}

export function deleteContextItem(id: string) {
  return apiDelete(`/api/context_items/${id}`);
}
