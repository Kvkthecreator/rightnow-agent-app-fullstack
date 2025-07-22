// web/lib/baskets/createBasketNew.ts
import { createClient } from "@/lib/supabaseClient";
import { fetchWithToken } from "@/lib/fetchWithToken";
import { apiUrl } from "@/lib/api";

/** Body accepted by /api/baskets/new (v1 mode) */
export interface NewBasketArgs {
  name?: string;
  status?: string;
  tags?: string[];
}

export async function createBasketNew(
  args: NewBasketArgs = {},
): Promise<{ id: string }> {

  // 🔐 Get Supabase JWT
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 🧱 Build headers and body
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const uid = user?.id;
  if (uid) headers["X-User-Id"] = uid;

  const payload: Record<string, any> = {
    name: args.name ?? "Untitled Basket",
    status: args.status ?? "active",
    tags: args.tags ?? [],
  };
  const body = JSON.stringify(payload);

  console.log("[createBasketNew] Payload:", JSON.parse(body));

  // 🚀 POST to backend
  const res = await fetchWithToken(apiUrl("/baskets/new"), {
    method: "POST",
    headers,
    body,
  });

  if (res.status !== 201) {
    throw new Error((await res.text()) || `createBasketNew failed: ${res.status}`);
  }

  const { id } = (await res.json()) as { id: string };
  return { id };
}
