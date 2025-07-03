export type Block = {
  id: string;
  semantic_type: string;
  content: string;
  state: string;
  scope: string | null;
  canonical_value: string | null;
  actor?: string;
  created_at?: string;
};

export type BlockWithHistory = Block & {
  prev_rev_id?: string | null;
  prev_content?: string | null;
};
