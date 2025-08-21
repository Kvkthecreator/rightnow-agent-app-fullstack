import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import type { Database } from "@/lib/dbTypes";

export type BasketSummary = Pick<
  Database["public"]["Tables"]["baskets"]["Row"],
  "id" | "status" | "updated_at" | "created_at"
>;

export async function listBasketsByWorkspace(workspaceId: string) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data, error } = await supabase
    .from("baskets")
    .select("id,status,created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  return {
    data: data?.map((b) => ({ ...b, updated_at: b.created_at })) ?? null,
    error,
  } as { data: BasketSummary[] | null; error: typeof error };
}
