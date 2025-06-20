import { createClient } from "@/lib/supabaseClient";
import { Database } from "@/lib/dbTypes";

export type BasketOverview =
  Database["public"]["Views"]["v_basket_overview"]["Row"];

export async function getAllBaskets() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("v_basket_overview")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as BasketOverview[];
}
