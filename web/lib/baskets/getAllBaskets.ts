// web/lib/baskets/getAllBaskets.ts
import { fetchWithToken } from "@/lib/fetchWithToken";
import { Database } from "@/lib/dbTypes";

export type BasketOverview =
  Database["public"]["Views"]["v_basket_overview"]["Row"];

export async function getAllBaskets() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/v_basket_overview?select=*&order=created_at.desc`;
  const res = await fetchWithToken(url);
  if (!res.ok) throw new Error("basket fetch failed");
  return (await res.json()) as BasketOverview[];
}
