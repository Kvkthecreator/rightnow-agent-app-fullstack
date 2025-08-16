// shared/contracts/ingest.ts
// Canon contracts: pure TypeScript types (no Zod).

import type { CreateBasketReq, CreateBasketRes } from "./baskets";
import type { CreateDumpRes } from "./dumps";

export type IngestItem = {
  dump_request_id: string; // UUID
  text_dump?: string;
  file_url?: string;
  meta?: Record<string, unknown>;
};

export type IngestReq = CreateBasketReq & {
  // Note: server bootstraps workspace; client sends items only
  items: IngestItem[];
};

export type IngestRes = CreateBasketRes & {
  dumps: CreateDumpRes[];
};

export type { CreateDumpRes };
