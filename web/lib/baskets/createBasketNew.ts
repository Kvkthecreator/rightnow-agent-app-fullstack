// web/lib/baskets/createBasketNew.ts
import { fetchWithToken } from "@/lib/fetchWithToken";

/** Body accepted by /api/baskets/new (v1 mode) */
export interface NewBasketArgs {
  name?: string;
  status?: string;
  tags?: string[];
}

export async function createBasketNew(
  args: NewBasketArgs = {},
): Promise<{ id: string }> {

  const payload = {
    name: args.name ?? "Untitled Basket",
    status: args.status ?? "active",
    tags: args.tags ?? [],
  };

  console.log("[createBasketNew] Payload:", payload);

  // Use internal API route instead of external API
  const res = await fetchWithToken("/api/baskets/new", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[createBasketNew] Error:", errorText);
    throw new Error(errorText || `createBasketNew failed: ${res.status}`);
  }

  const data = await res.json();
  console.log("[createBasketNew] Success:", data);
  
  return { id: data.id };
}
