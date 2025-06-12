import useSWR from "swr";
import { apiGet } from "@/lib/api";

const fetcher = (url: string) => apiGet<{ count: number }>(url);

export function usePendingChanges(basketId: string) {
  const { data } = useSWR(
    () => (basketId ? `/api/baskets/${basketId}/change-queue?status=pending` : null),
    fetcher,
    { refreshInterval: 15_000 },
  );
  return data?.count ?? 0;
}
