import useSWR from "swr";
import { apiGet } from "@/lib/api";

export interface HighlightSuggestion {
  dump_input_id: string;
  conflicting_block_id: string;
  reason: string;
}

const fetcher = (url: string) => apiGet<HighlightSuggestion[]>(url);

export function useHighlights(basketId: string) {
  const { data, isLoading, error } = useSWR(
    () => (basketId ? `/api/baskets/${basketId}/input-highlights` : null),
    fetcher,
  );
  return { highlights: data ?? [], isLoading, error };
}
