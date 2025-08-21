import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import type { Database } from "@/lib/dbTypes";

export type BasketSummary = Pick<
  Database["public"]["Tables"]["baskets"]["Row"],
  "id" | "status" | "updated_at" | "created_at"
>;

export function listBasketsByWorkspace(workspaceId: string) {
  const supabase = createServerComponentClient({ cookies });
  return supabase
    .from("baskets")
    .select("id,status,updated_at,created_at")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });
}
