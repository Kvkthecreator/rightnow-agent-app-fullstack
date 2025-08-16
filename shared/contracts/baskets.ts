import { z } from 'zod';

export const CreateBasketReqSchema = z.object({
  name: z.string().optional(),
  idempotency_key: z.string().uuid(),
});
export type CreateBasketReq = z.infer<typeof CreateBasketReqSchema>;

export const CreateBasketResSchema = z.object({
  basket_id: z.string().uuid(),
});
export type CreateBasketRes = z.infer<typeof CreateBasketResSchema>;
