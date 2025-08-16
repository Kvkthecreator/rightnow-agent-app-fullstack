// shared/contracts/ingest.ts
// Full replacement – resolves merge by keeping canonical Zod schemas
// while preserving legacy type exports used on `main`.

import { z } from "zod";
import type { CreateBasketReq, CreateBasketRes } from "./baskets";
import type { CreateDumpRes } from "./dumps";

/* ------------------------------------------------------------------ */
/* Canonical (doc-aligned) schemas                                     */
/* ------------------------------------------------------------------ */

export const IngestDumpSchema = z.object({
  dump_request_id: z.string().uuid(),
  text_dump: z.string().optional(),
  file_urls: z.array(z.string()).optional(),
});
export type IngestDump = z.infer<typeof IngestDumpSchema>;

export const IngestReqSchema = z.object({
  idempotency_key: z.string().uuid(),
  basket: z.object({ name: z.string().optional() }).optional(),
  dumps: z.array(IngestDumpSchema),
});
export type IngestReq = z.infer<typeof IngestReqSchema>;

export const IngestResSchema = z.object({
  workspace_id: z.string().uuid(),
  basket: z.object({ id: z.string().uuid(), created: z.boolean() }),
  dumps: z.array(
    z.object({
      id: z.string().uuid(),
      dump_request_id: z.string().uuid(),
      created: z.boolean(),
    })
  ),
});
export type IngestRes = z.infer<typeof IngestResSchema>;

/* ------------------------------------------------------------------ */
/* Legacy compatibility (keeps `main` compiling during transition)     */
/* ------------------------------------------------------------------ */

export type IngestItem = IngestDump;

export type LegacyIngestReq = CreateBasketReq & {
  items: IngestItem[];
};

export type LegacyIngestRes = CreateBasketRes & {
  dumps: CreateDumpRes[];
};

// Re-export for modules that imported from here on `main`
export type { CreateDumpRes };
