export type Source =
  | { type: "raw_dump"; id: string }
  | { type: "text"; content: string }
  | { type: "file"; id: string; mime?: string };

export interface BasketChangeRequest {
  request_id: string;
  basket_id: string;
  intent?: string;
  sources?: Source[];
  agent_hints?: string[];
  user_context?: Record<string, unknown>;
  /**
   * Work request type handled by Manager Agent
   * e.g. "raw_dump_process" or "block_update"
   */
  type?: string;
  rawDumpId?: string;
  blockId?: string;
  payload?: unknown;
}

export type EntityChange =
  | { entity: "context_block"; id: string; from_version?: number; to_version?: number; diff?: string }
  | { entity: "task"; id: string; op: "CREATE" | "UPDATE" | "DELETE"; payload?: unknown }
  | { entity: "document"; id: string; from_version?: number; to_version?: number; diff?: string };

export interface RecommendedAction {
  type: "APPLY_ALL" | "EDIT" | "RUN_AGENT";
  target?: "context_block" | "task" | "document";
  id?: string;
  args?: Record<string, unknown>;
}

export interface BasketDelta {
  delta_id: string;
  basket_id: string;
  summary: string;
  changes: EntityChange[];
  recommended_actions?: RecommendedAction[];
  explanations?: { by: "manager" | "agent"; text: string }[];
  confidence?: number;
  created_at: string;
}
