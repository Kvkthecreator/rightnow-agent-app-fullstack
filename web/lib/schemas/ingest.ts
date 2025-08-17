import { z } from 'zod';
import type { IngestItem, IngestReq, IngestRes } from '@shared/contracts/ingest';

export const IngestItemSchema = z.object({
  dump_request_id: z.string().uuid(),
  text_dump: z.string().optional(),
  file_url: z.string().url().optional(),
  meta: z.record(z.unknown()).optional(),
}) satisfies z.ZodType<IngestItem>;

export const IngestReqSchema = z.object({
  idempotency_key: z.string().uuid(),
  basket: z.object({
    name: z.string().optional(),
  }).optional(),
  dumps: z.array(IngestItemSchema),
}) satisfies z.ZodType<IngestReq>;

export const IngestResSchema = z.object({
  basket_id: z.string().uuid(),
  id: z.string().uuid(),
  name: z.string(),
  dumps: z.array(z.object({
    dump_id: z.string().uuid(),
  })),
}) satisfies z.ZodType<IngestRes>;
