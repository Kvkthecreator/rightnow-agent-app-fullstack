import type { BasketSummary } from './listBasketsByWorkspace';

interface Params {
  baskets: BasketSummary[];
  lastBasketId?: string | null;
}

export function pickMostRelevantBasket({ baskets, lastBasketId }: Params): BasketSummary {
  if (lastBasketId) {
    const match = baskets.find((b) => b.id === lastBasketId);
    if (match) return match;
  }
  return baskets[0];
}
