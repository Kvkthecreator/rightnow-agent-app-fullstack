export type CreateDumpReq = {
  basket_id: string;
  dump_request_id: string; // UUID
  text_dump?: string;
  file_url?: string;
  meta?: Record<string, unknown>;
};

export type CreateDumpRes = { 
  dump_id: string; 
};
