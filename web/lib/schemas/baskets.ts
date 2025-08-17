import { z } from 'zod';
import type { CreateBasketReq, CreateBasketRes } from '@shared/contracts/baskets';

export const CreateBasketReqSchema = z.object({
  idempotency_key: z.string().uuid(),
  intent: z.string(),
  raw_dump: z.object({
    text: z.string(),
    file_urls: z.array(z.string()),
  }),
  notes: z.array(z.string()).optional(),
}) satisfies z.ZodType<CreateBasketReq>;

export const CreateBasketResSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
}) satisfies z.ZodType<CreateBasketRes>;