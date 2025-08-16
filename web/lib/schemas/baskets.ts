import { z } from 'zod';
import type { CreateBasketReq, CreateBasketRes } from '@shared/contracts/baskets';

export const CreateBasketReqSchema = z.object({
  idempotency_key: z.string().uuid(),
  basket: z.object({
    name: z.string().optional(),
  }),
}) satisfies z.ZodType<CreateBasketReq>;

export const CreateBasketResSchema = z.object({
  basket_id: z.string().uuid(),
}) satisfies z.ZodType<CreateBasketRes>;