import useSWR from "swr";
import { apiGet } from "../api";
import type { Document } from "@/types/document";

export interface DocumentRow extends Document {
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
