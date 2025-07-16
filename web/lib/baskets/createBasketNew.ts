// web/lib/baskets/createBasketNew.ts
import { createClient } from "@/lib/supabaseClient";
import { fetchWithToken } from "@/lib/fetchWithToken";
import { apiUrl } from "@/lib/api";

/** Body accepted by /api/baskets/new (v1 mode) */
export interface NewBasketArgs {
  /** Free-form markdown or plaintext that seeds the basket */
  text_dump: string | null;
  /** Optional previously-uploaded file URLs (≤ 5) */
  file_urls?: string[];
}

export async function createBasketNew(
  args: NewBasketArgs,
): Promise<{ id: string }> {
  console.debug("[createBasketNew] text_dump:", args.text_dump);

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

  // ✅ Ensure text_dump is never null
  const body = JSON.stringify({
    text_dump: args.text_dump ?? "", // 🔥 key fix here
    file_urls: args.file_urls ?? [],
  });

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
