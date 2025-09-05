// Context items and related types

export type ContextItem = {
  id: string;
  basket_id: string;
  document_id?: string;
  type: string;                    // Required: 'entity' | 'topic' | 'intent' | 'source_ref' | 'cue' | 'task' 
  content?: string;                // Main content/label
  title?: string;
  description?: string;
  confidence_score?: number;
  status: 'active' | 'archived';
  metadata?: Record<string, any>;
  normalized_label?: string;
  raw_dump_id?: string;
  created_at?: string;
  updated_at?: string;
};

// For creating context items
export type CreateContextItemPayload = {
  basket_id: string;
  type: string;
  content?: string;
  title?: string;  
  description?: string;
  metadata?: Record<string, any>;
};