import useSWR from "swr";
import { apiGet } from "@/lib/api";

export interface DocumentRow {
  id: string;
  title: string;
  updated_at: string;
}

const fetcher = (url: string) => apiGet<DocumentRow[]>(url);

export function useDocuments(basketId: string) {
  const { data, error, isLoading } = useSWR(
    () => (basketId ? `/api/baskets/${basketId}/docs` : null),
    fetcher,
  );
  return { docs: data ?? [], isLoading, error };
}
