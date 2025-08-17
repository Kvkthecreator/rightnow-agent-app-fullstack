// web/lib/baskets/getAllBaskets.ts
import { createBrowserClient } from "@/lib/supabase/clients";
import { Database } from "@/lib/dbTypes";

export type BasketOverview = Pick<
  Database["public"]["Tables"]["baskets"]["Row"],
  "id" | "name" | "created_at"
>;

export async function getAllBaskets(): Promise<BasketOverview[]> {
  const supabase = createBrowserClient();

  const {
    data,
    error,
  } = await supabase
    .from("baskets")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Supabase error while fetching baskets:", error.message);
    return [];
  }

  return data ?? [];
}
