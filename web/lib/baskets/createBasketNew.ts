// web/lib/baskets/createBasketNew.ts
import { createClient } from "@/lib/supabaseClient";
import { fetchWithToken } from "@/lib/fetchWithToken";
import { apiUrl } from "@/lib/api";

/** Body accepted by /api/baskets/new (v1 mode) */
export interface NewBasketArgs {
  /** Free-form markdown or plaintext that seeds the basket */
  text_dump: string;
  /** Optional previously-uploaded file URLs (≤ 5) */
  file_urls?: string[];
}

export async function createBasketNew(
  args: NewBasketArgs,
): Promise<{ id: string }> {
  console.debug("[createBasketNew] text_dump:", args.text_dump);
  if (!args.text_dump || args.text_dump.trim().length === 0) {
    console.warn("[createBasketNew] text_dump is empty");
    throw new Error("text_dump cannot be empty");
  }
  /* ── 1️⃣  get the caller’s JWT for the backend ─────────────────────────── */
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();

  /* ── 2️⃣  assemble headers & body that FastAPI expects ─────────────────── */
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const uid = data.session?.user.id;
  if (uid) headers["X-User-Id"] = uid; // FastAPI route ignores it for now

  const body = JSON.stringify({
    text_dump: args.text_dump,
    file_urls: args.file_urls ?? [],
  });
  console.log("[createBasketNew] Payload:", JSON.parse(body));

  /* ── 3️⃣  POST to the backend (fetchWithToken adds sb-access-token) ────── */
  const res = await fetchWithToken(apiUrl("/api/baskets/new"), {
    method: "POST",
    headers,
    body,
  });

  if (res.status !== 201) {
    throw new Error((await res.text()) || `createBasketNew failed: ${res.status}`);
  }

  /* ── 4️⃣  FastAPI returns { "id": "<uuid>" } ─────────────────────────────── */
  const { id } = (await res.json()) as { id: string };
  return { id };
}
