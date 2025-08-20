// Basket core types and API contracts

export type Basket = {
  id: string;
  name: string;
  status: "INIT" | "ACTIVE" | "ARCHIVED" | "DEPRECATED" | string;
  workspace_id?: string;
  raw_dump_id?: string | null;
  origin_template?: string | null;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  // Aggregate counts for dashboard metrics
  blocks?: number;
  raw_dumps?: number;
  documents?: number;
};

// API Request/Response types
export type CreateBasketReq = {
  idempotency_key: string;
  intent: string;
  raw_dump: {
    text: string;
    file_urls: string[];
  };
  notes?: string[];
};

export type CreateBasketRes = {
  basket_id: string;
  id: string;
  name: string;
};

// Basket change operations
export type BasketChangeRequest = {
  id: string;
  basket_id: string;
  request_type: "add_context" | "update_block" | "create_document";
  payload: Record<string, any>;
  metadata?: Record<string, any>;
};

// BasketDelta is an alias for Delta for backward compatibility
export type BasketDelta = {
  delta_id: string;
  basket_id: string;
  summary: string;
  status?: string;
  changes?: unknown[];
  metadata?: Record<string, any>;
  created_at: string;
};