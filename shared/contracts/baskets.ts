export type CreateBasketReq = {
  workspace_id: string;
  name?: string;
  idempotency_key: string; // UUID
};

export type CreateBasketRes = { 
  basket_id: string; 
};
