import { Database } from "@/lib/dbTypes";
import { fetchWithToken } from "@/lib/fetchWithToken";

export type BasketOverview =
  Database["public"]["Views"]["v_basket_overview"]["Row"];

export async function getAllBaskets() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/v_basket_overview?select=*&order=created_at.desc`;
  const res = await fetchWithToken(url);
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `getAllBaskets failed (${res.status})`);
  }
  return (await res.json()) as BasketOverview[];
}
