import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import type { Basket } from "@/types";

export async function getBasketServer(id: string, workspaceId: string): Promise<Basket | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("baskets")
    .select("id,name,state,created_at")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .single();
  if (error) {
    console.error("[getBasketServer]", error.message);
    return null;
  }
  if (!data) return null;
  return { ...data, status: (data as any).state } as Basket;
}
