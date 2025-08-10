import type { BasketChangeRequest, BasketDelta } from "@shared/contracts/basket";
import { basketApi } from "./client";

export async function postBasketWork(req: BasketChangeRequest): Promise<BasketDelta> {
  return basketApi.processWork(req.basket_id, req);
}

export async function listDeltas(basketId: string) {
  return basketApi.getDeltas(basketId);
}

export async function applyDelta(basketId: string, deltaId: string) {
  return basketApi.applyDelta(basketId, deltaId);
}
