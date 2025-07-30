export type Document = {
  id: string;
  title: string;
  basket_id: string;
  content_raw?: string;
  document_type?: string;
  workspace_id?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
};
