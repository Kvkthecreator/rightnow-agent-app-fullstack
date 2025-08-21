import type { BasketSummary } from './listBasketsByWorkspace';

interface Params {
  baskets: BasketSummary[];
  lastBasketId?: string | null;
}

export function pickMostRelevantBasket({ baskets, lastBasketId }: Params): BasketSummary {
  if (baskets.length === 1) {
    const only = baskets[0];
    return lastBasketId === only.id ? only : only;
  }

  if (lastBasketId) {
    const match = baskets.find((b) => b.id === lastBasketId);
    if (match) return match;
  }

  return baskets[0];
}
