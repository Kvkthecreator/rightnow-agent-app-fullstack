/**
 * Component: useBasketTimeline
 * Hook for fetching basket timeline
 * @contract output : TimelinePage
 */
import useSWR from "swr";
import { fetchTimeline } from "@/lib/api/timeline";
import type { TimelineItem } from "@/lib/api/timeline";

type TimelinePage = { items: TimelineItem[]; next_before: string | null };

export function useBasketTimeline(basketId: string) {
  return useSWR<TimelinePage>(
    `/api/baskets/${basketId}/timeline`,
    () => fetchTimeline(basketId)
  );
}