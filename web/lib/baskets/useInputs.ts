import useSWR from "swr";
import { apiGet } from "@/lib/api";

export interface BasketInput {
  id: string;
  content: string;
  created_at: string;
}

const fetcher = (url: string) => apiGet<BasketInput[]>(url);

export function useInputs(basketId: string) {
  const { data, error, isLoading } = useSWR(
    () => (basketId ? `/api/baskets/${basketId}/inputs` : null),
    fetcher,
  );
  return { inputs: data ?? [], error, isLoading };
}
