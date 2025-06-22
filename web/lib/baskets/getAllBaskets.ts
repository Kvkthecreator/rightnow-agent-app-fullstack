// web/lib/baskets/getAllBaskets.ts
import { apiGet } from "@/lib/api";
import { Database } from "@/lib/dbTypes";

export type BasketOverview =
  Database["public"]["Views"]["v_basket_overview"]["Row"];

export async function getAllBaskets() {
  // Calls your FastAPI server which proxies to Supabase securely
  return apiGet<BasketOverview[]>("/api/baskets/list");
}
