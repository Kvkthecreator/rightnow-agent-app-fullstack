import { z } from 'zod';
import type { CreateBasketReq, CreateBasketRes } from '@shared/contracts/baskets';

export const CreateBasketReqSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().optional(),
  idempotency_key: z.string().uuid(),
}) satisfies z.ZodType<CreateBasketReq>;

export const CreateBasketResSchema = z.object({
  basket_id: z.string().uuid(),
}) satisfies z.ZodType<CreateBasketRes>;