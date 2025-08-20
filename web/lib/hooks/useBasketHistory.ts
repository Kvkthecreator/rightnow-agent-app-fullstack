import useSWR from "swr";
import type { HistoryPage } from "@shared/contracts/memory";

export function useBasketHistory(basketId: string) {
  return useSWR<HistoryPage>(`/api/baskets/${basketId}/history`, (url: string) => fetch(url, { cache: "no-store" }).then(r => r.json()));
}