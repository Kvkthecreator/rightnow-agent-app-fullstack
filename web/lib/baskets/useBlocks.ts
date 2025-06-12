import useSWR from "swr";
import { apiGet } from "@/lib/api";

export interface BlockRow {
  id: string;
  label: string;
  type: string | null;
  updated_at: string;
  commit_id: string | null;
}

const fetcher = (url: string) => apiGet<BlockRow[]>(url);

export function useBlocks(basketId: string) {
  const { data, isLoading, error } = useSWR(
    () => (basketId ? `/api/baskets/${basketId}/blocks` : null),
    fetcher,
    { refreshInterval: 10_000 },
  );
  return { blocks: data ?? [], isLoading, error };
}
