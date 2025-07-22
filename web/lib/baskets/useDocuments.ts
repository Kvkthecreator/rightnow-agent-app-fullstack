import useSWR from "swr";
import type { Document } from "@/types";
import { createClient } from "@/lib/supabaseClient";

export interface DocumentRow extends Document {
  updated_at: string;
}

const fetcher = async (basketId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, created_at, updated_at, basket_id")
    .eq("basket_id", basketId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!data) return [];
  return data.map((doc) => ({
    updated_at: doc.updated_at ?? doc.created_at,
    ...doc,
  })) as DocumentRow[];
};

export function useDocuments(basketId: string) {
  const { data, error, isLoading } = useSWR(
    () => (basketId ? basketId : null),
    fetcher,
    { refreshInterval: 10_000 },
  );
  return { docs: data ?? [], isLoading, error };
}
