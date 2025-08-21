/**
 * Component: useBasketTimeline
 * Hook for fetching basket timeline
 * @contract output : TimelinePage
 */
import useSWR from "swr";
import type { TimelinePage } from "@shared/contracts/memory";

export function useBasketTimeline(basketId: string) {
  return useSWR<TimelinePage>(`/api/baskets/${basketId}/timeline`, (url: string) => fetch(url, { cache: "no-store" }).then(r => r.json()));
}
