// shared/contracts/baskets.ts
// Canon contracts: pure TypeScript types (no Zod).

export type CreateBasketReq = {
  idempotency_key: string; // UUID
  basket: {
    name?: string;
  };
};

export type CreateBasketRes = {
  basket_id: string; // UUID
};
