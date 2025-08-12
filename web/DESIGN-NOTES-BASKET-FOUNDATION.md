# Basket Foundation (Frontend)
- One layout: `BasketWorkLayout` (left/center/right)
- One entry: `/baskets/[id]/work` (no intermediate redirects)
- Data: React Query hooks (`useBasket`, `useBasketDeltas`), 3s polling
- Components live under `components/features/basket/*`
- API access flows through `lib/api/client.ts` only
