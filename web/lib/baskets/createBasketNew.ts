export interface NewBasketArgs {
  text_dump: string;
  file_urls?: string[];
}
import { createClient } from "@/lib/supabaseClient";
import { fetchWithToken } from "@/lib/fetchWithToken";
import { withApiOrigin } from "@/lib/apiOrigin";
export async function createBasketNew(
  args: NewBasketArgs,
): Promise<{ id: string }> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const uid = data.session?.user.id;
  if (uid) headers['X-User-Id'] = uid;
  const body = { text_dump: args.text_dump, file_urls: args.file_urls ?? [] };
  const res = await fetchWithToken(withApiOrigin("/api/baskets/new"), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(text || `createBasketNew failed with ${res.status}`);
  }
  const payload = await res.json();
  return { id: payload.basket_id };
}
