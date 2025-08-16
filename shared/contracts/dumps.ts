import { z } from 'zod';

export const CreateDumpReqSchema = z.object({
  basket_id: z.string().uuid(),
  dump_request_id: z.string().uuid(),
  text_dump: z.string().optional(),
  file_url: z.string().url().optional(),
  meta: z.record(z.any()).optional(),
});
export type CreateDumpReq = z.infer<typeof CreateDumpReqSchema>;

export const CreateDumpResSchema = z.object({
  dump_id: z.string().uuid(),
});
export type CreateDumpRes = z.infer<typeof CreateDumpResSchema>;
