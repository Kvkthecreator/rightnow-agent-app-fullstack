import { z } from 'zod';
import type { CreateDumpReq, CreateDumpRes } from '@shared/contracts/dumps';

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
  dump_id: z.string().uuid(),
}) satisfies z.ZodType<CreateDumpRes>;