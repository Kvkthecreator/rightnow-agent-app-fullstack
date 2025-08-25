import { z } from "zod";

export const ReflectionDTOSchema = z.object({
  id: z.string().uuid(),
  basket_id: z.string().uuid(),
  reflection_text: z.string().min(1),
  substrate_window_start: z.string(),
  substrate_window_end: z.string(),
  computation_timestamp: z.string(),
  meta: z
    .object({
      computation_trace_id: z.string().uuid().optional(),
      substrate_dump_count: z.number().int().min(0).optional(),
      substrate_tokens: z.number().int().min(0).optional(),
    })
    .catchall(z.unknown())
    .optional(),
}).strict();

export type ReflectionDTO = z.infer<typeof ReflectionDTOSchema>;

export const GetReflectionsResponseSchema = z.object({
  reflections: z.array(ReflectionDTOSchema),
  has_more: z.boolean(),
  next_cursor: z.string().optional(),
}).strict();

export type GetReflectionsResponse = z.infer<typeof GetReflectionsResponseSchema>;