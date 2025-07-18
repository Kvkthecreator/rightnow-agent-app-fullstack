// web/lib/baskets/getAllBaskets.ts
import { Database } from "@/lib/dbTypes";

export type BasketOverview =
  Database["public"]["Views"]["v_basket_overview"]["Row"];

export async function getAllBaskets(): Promise<BasketOverview[]> {
  try {
    const res = await fetch("/api/baskets/list", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      console.error(
        "\u274c Failed to fetch baskets:",
        res.status,
        await res.text(),
      );
      return [];
    }

    const data = await res.json();
    return data.baskets || [];
  } catch (err) {
    console.error("\u274c Network error while fetching baskets:", err);
    return [];
  }
}
