import { createClient } from "@/lib/supabaseClient";

export async function fetchWithToken(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      "sb-access-token": token,
      Authorization: `Bearer ${token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
}
