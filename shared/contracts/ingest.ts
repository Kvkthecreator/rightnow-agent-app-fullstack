import type { CreateBasketReq, CreateBasketRes } from "./baskets";

export type IngestItem = {
  dump_request_id: string; // UUID
  text_dump?: string;
  file_url?: string;
  meta?: Record<string, unknown>;
};

export type IngestReq = CreateBasketReq & { 
  items: IngestItem[]; 
};

export type IngestRes = { 
  basket_id: string; 
  dump_ids: string[]; 
};