import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import type { Basket } from "@/types";

export async function getBasketServer(
  id: string,
  workspaceId: string
): Promise<Basket | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("baskets")
    .select("id, name, status, created_at, tags")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .single();

  if (error) {
    console.error("[getBasketServer]", error.message);
    return null;
  }

  return data ?? null;
}
