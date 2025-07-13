import { apiPost, apiPut, apiDelete } from './api';

export interface ContextItemPayload {
  basket_id?: string;
  document_id?: string | null;
  type: string;
  content: string;
  status?: string;
}

export function createContextItem(body: ContextItemPayload) {
  return apiPost('/api/context-items', body);
}

export function updateContextItem(id: string, body: Partial<ContextItemPayload>) {
  return apiPut(`/api/context-items/${id}`, body);
}

export function deleteContextItem(id: string) {
  return apiDelete(`/api/context-items/${id}`);
}
