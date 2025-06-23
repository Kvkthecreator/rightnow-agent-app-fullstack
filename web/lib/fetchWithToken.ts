import { createClient } from "@/lib/supabaseClient";

export async function fetchWithToken(
  input: RequestInfo | URL,
  init: RequestInit = {},
  token?: string,
) {
  let jwt = token;
  if (!jwt) {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    jwt = session?.access_token ?? "";
  }
  if (!jwt) {
    throw new Error("No access token found. Please log in to continue.");
  }
  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      "sb-access-token": jwt,
      Authorization: `Bearer ${jwt}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
}
