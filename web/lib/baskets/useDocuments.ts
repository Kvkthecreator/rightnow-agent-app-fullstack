import useSWR from "swr";
import { apiGet } from "../api";

export interface DocumentRow {
  id: string;
  title: string | null;
  updated_at: string;
}

const fetcher = (url: string) => apiGet<DocumentRow[]>(url);

export function useDocuments(basketId: string) {
  const { data, error, isLoading } = useSWR(
    () => (basketId ? `/api/baskets/${basketId}/docs` : null),
    fetcher,
    { refreshInterval: 10_000 },
  );
  return { docs: data ?? [], isLoading, error };
}
