import { apiClient } from './api/client';

export interface ContextItemPayload {
  basket_id?: string;
  document_id?: string | null;
  type: string;
  summary: string;
  status?: string;
}

export function createContextItem(body: ContextItemPayload) {
  return apiClient.request('/api/context_items', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function updateContextItem(id: string, body: Partial<ContextItemPayload>) {
  return apiClient.request(`/api/context_items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

export function deleteContextItem(id: string) {
  return apiClient.request(`/api/context_items/${id}`, {
    method: 'DELETE'
  });
}
