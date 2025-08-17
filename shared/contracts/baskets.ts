// shared/contracts/baskets.ts
// Canon contracts: pure TypeScript types (no Zod).

export type CreateBasketReq = {
  idempotency_key: string; // UUID
  intent: string;
  raw_dump: {
    text: string;
    file_urls: string[];
  };
  notes?: string[];
};

export type CreateBasketRes = {
  basket_id: string; // UUID
  id: string; // UUID (duplicate of basket_id for legacy clients)
  name: string;
};
