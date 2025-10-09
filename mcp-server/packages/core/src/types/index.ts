// YARNNN MCP Server Type Definitions
// Based on YARNNN Canon v3.0

export interface UserContext {
  userId: string;
  workspaceId: string;
  basketId?: string;
}

export interface AuthValidationResponse {
  valid: boolean;
  user_id?: string;
  workspace_id?: string;
  basket_id?: string;
  error?: string;
}

// Substrate Types (Memory Layer)
export interface RawDump {
  id: string;
  basket_id: string;
  workspace_id: string;
  body_md: string;
  created_at: string;
  source_meta?: Record<string, any>;
}

export interface ContextBlock {
  id: string;
  basket_id: string;
  workspace_id: string;
  semantic_type: string;
  title: string | null;
  content: string;
  confidence_score: number;
  state: 'proposed' | 'approved' | 'archived';
  metadata?: Record<string, any>;
}

export interface ContextItem {
  id: string;
  basket_id: string;
  workspace_id: string;
  semantic_category: string;
  semantic_meaning: string;
  context_block_id?: string;
  metadata?: Record<string, any>;
}

// MCP Tool Responses
export interface CreateMemoryResponse {
  status: 'success' | 'error';
  basket_id?: string;
  basket_name?: string;
  blocks_created?: number;
  visualization?: string;
  actions?: string[];
  error?: string;
}

export interface SubstrateResponse {
  substrate: SubstrateItem[];
  total_count: number;
  substrate_snapshot_id?: string;
}

export interface SubstrateItem {
  type: 'block' | 'item' | 'raw_dump';
  id: string;
  content: string;
  semantic_type?: string;
  semantic_category?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface AddSubstrateResponse {
  status: 'success' | 'error';
  raw_dump_id?: string;
  proposed_blocks?: number;
  governance_mode?: 'auto' | 'manual';
  error?: string;
}

export interface ValidationResponse {
  alignment_score: number;
  conflicts: ConflictItem[];
  recommendation: string;
  analysis?: string;
}

export interface ConflictItem {
  existing_substrate_id: string;
  conflict_type: 'contradiction' | 'overlap' | 'refinement';
  description: string;
  severity: 'high' | 'medium' | 'low';
}

// Error Types
export interface YARNNNError {
  code: string;
  message: string;
  details?: any;
}
