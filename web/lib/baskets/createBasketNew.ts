// web/lib/baskets/createBasketNew.ts
import { createClient } from "@/lib/supabaseClient";
import { fetchWithToken } from "@/lib/fetchWithToken";
import { withApiOrigin } from "@/lib/apiOrigin";

/** Body accepted by /api/baskets/new (v1 mode) */
export interface NewBasketArgs {
  /** Free-form markdown or plaintext that seeds the basket */
  text: string;
  /** Optional previously-uploaded file URLs (≤ 5) */
  file_urls?: string[];
}

export async function createBasketNew(
  args: NewBasketArgs,
): Promise<{ id: string }> {
  /* ── 1️⃣  get the caller’s JWT for the backend ─────────────────────────── */
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();

  /* ── 2️⃣  assemble headers & body that FastAPI expects ─────────────────── */
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const uid = data.session?.user.id;
  if (uid) headers["X-User-Id"] = uid; // FastAPI route ignores it for now

  const body = JSON.stringify({
    text: args.text,                // 🔺 was text_dump
    file_urls: args.file_urls ?? [],
  });

  /* ── 3️⃣  POST to the backend (fetchWithToken adds sb-access-token) ────── */
  const res = await fetchWithToken(withApiOrigin("/api/baskets/new"), {
    method: "POST",
    headers,
    body,
  });

  if (res.status !== 201) {
    throw new Error((await res.text()) || `createBasketNew failed: ${res.status}`);
  }

  /* ── 4️⃣  FastAPI returns { "basket_id": "<uuid>" } ────────────────────── */
  const { basket_id } = (await res.json()) as { basket_id: string };
  return { id: basket_id };
}
