// Dump core types and API contracts

export type RawDump = {
  id: string;
  basket_id: string;
  workspace_id: string;
  body_md: string | null;
  file_url?: string | null;
  dump_request_id?: string;
  source_meta?: Record<string, any>;
  processing_status: "unprocessed" | "processing" | "processed" | "failed";
  created_at: string;
  processed_at?: string;
};

// Legacy dump type for compatibility
export type Dump = {
  id: string;
  basket_id: string;
  body_md: string;
  created_at: string;
};

// API Request/Response types
export type CreateDumpReq = {
  basket_id: string;
  dump_request_id: string;
  text_dump?: string;
  file_url?: string;
  meta?: Record<string, any>;
};

export type CreateDumpRes = {
  id: string;
  basket_id: string;
  text_dump: string | null;
  created_at: string;
};