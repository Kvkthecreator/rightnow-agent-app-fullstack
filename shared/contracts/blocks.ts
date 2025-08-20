// Block core types and API contracts

export type Block = {
  id: string;
  basket_id?: string;
  workspace_id?: string;
  document_id?: string;
  raw_dump_id?: string | null;
  title?: string;
  body_md?: string;
  content: string; // Legacy field for backward compatibility (required)
  type: string; // Legacy field for backward compatibility (required)
  status?: "proposed" | "accepted" | "rejected";
  semantic_type?: string;
  confidence_score?: number;
  processing_agent?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};

export type BlockWithHistory = Block & {
  prev_rev_id?: string | null;
  prev_content?: string | null;
};

// API Request/Response types
export type UpdateBlockRequest = {
  status?: "accepted" | "rejected";
  title?: string;
  body_md?: string;
};