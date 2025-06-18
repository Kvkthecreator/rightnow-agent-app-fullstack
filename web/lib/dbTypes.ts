export interface Block {
  id?: string;
  basket_id?: string;
  parent_block_id?: string;
  semantic_type?: string;
  content?: string;
  version?: number;
  state?: string;
  scope?: string;
  canonical_value?: string;
  origin_ref?: string;
  created_at?: string;
}

export interface Basket {
  id?: string;
  name?: string;
  raw_dump_id?: string;
  state?: string;
  created_at?: string;
}

export interface Event {
  id?: string;
  basket_id?: string;
  block_id?: string;
  kind?: string;
  payload?: Record<string, any>;
  ts?: string;
}
