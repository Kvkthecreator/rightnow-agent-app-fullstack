export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      blocks: {
        Row: {
          id: string;
          basket_id: string | null;
          parent_block_id: string | null;
          semantic_type: string;
          content: string | null;
          version: number;
          state: string;
          scope: string | null;
          canonical_value: string | null;
          origin_ref: string | null;
          created_at: string;
        };
      };
      baskets: {
        Row: {
          id: string;
          name: string | null;
          status: string;
          created_at: string;
          user_id: string;
          raw_dump_id: string;
          workspace_id: string;
        };
      };
      events: {
        Row: {
          id: string;
          basket_id: string | null;
          block_id: string | null;
          kind: string | null;
          payload: Record<string, any> | null;
          ts: string;
        };
      };
      documents: {
        Row: {
          id: string;
          basket_id: string | null;
          title: string;
          content_raw: string;
          created_at: string;
          updated_at: string;
        };
      };
    };
    Views: {
      v_basket_overview: {
        Row: {
          id: string;
          name: string | null;
          raw_dump_body: string | null;
          created_at: string | null;
        };
      };
    };
  };
}
