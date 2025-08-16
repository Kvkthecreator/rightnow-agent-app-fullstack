// shared/contracts/baskets.ts
// Canon contracts: pure TypeScript types (no Zod).

export type CreateBasketReq = {
  // workspace is resolved server-side; client must NOT send it
  name?: string;
  idempotency_key: string; // UUID
};

export type CreateBasketRes = {
  basket_id: string; // UUID
};
