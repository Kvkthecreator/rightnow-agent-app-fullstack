import { apiClient } from './api/client';

export interface ContextPayload {
  basket_id?: string;
  document_id?: string | null;
  type: string;
  content?: string;
  title?: string;
  description?: string;
  metadata?: Record<string, any>;
  status?: 'active' | 'archived';
}

export function createContextItem(body: ContextPayload) {
  return apiClient.request('/api/context_items', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function updateContextItem(id: string, body: Partial<ContextPayload>) {
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
