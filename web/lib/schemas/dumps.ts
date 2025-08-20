/**
 * Component: DumpSchemas
 * Schema definitions for dump operations
 * @contract input  : CreateDumpReq
 * @contract output : CreateDumpRes
 */
import { z } from 'zod';
import type { CreateDumpReq } from '@shared/contracts/dumps';

export const CreateDumpReqSchema = z.object({
  basket_id: z.string().uuid(),
  dump_request_id: z.string().uuid(),
  text_dump: z.string().optional(),
  file_url: z.string().url().optional(),
  meta: z.record(z.unknown()).optional(),
}).refine(
  (data) => data.text_dump || data.file_url,
  { message: "Either text_dump or file_url must be provided" }
) satisfies z.ZodType<CreateDumpReq>;

export const CreateDumpResSchema = z.object({
  id: z.string().uuid(),
  basket_id: z.string().uuid(),
  text_dump: z.string().nullable(),
  created_at: z.string(),
});
export type CreateDumpRes = z.infer<typeof CreateDumpResSchema>;