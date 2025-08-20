// Context items and related types

export type ContextItem = {
  id: string;
  document_id?: string;
  basket_id?: string;
  workspace_id?: string;
  type?: string;
  title: string;
  description?: string;
  summary: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};