import useSWR from "swr";
import { apiClient } from "@/lib/api/client";

export interface BlockRow {
  id: string;
  label: string;
  type: string | null;
  updated_at: string;
  commit_id: string | null;
}

const fetcher = (url: string) => apiClient.request<BlockRow[]>(url);

export function useBlocks(basketId: string) {
  const { data, isLoading, error } = useSWR(
    `/api/baskets/${basketId}/building-blocks`,
    fetcher,
    { 
      refreshInterval: 20_000,  // Reduced from 10s to 20s
      revalidateOnFocus: true,  // Refresh when user returns to tab
      revalidateOnReconnect: true,
    },
  );
  return { blocks: data ?? [], isLoading, error };
}
