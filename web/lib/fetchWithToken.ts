import { createClient } from "./supabaseClient";

export async function fetchWithToken(
  input: RequestInfo | URL,
  init: RequestInit = {},
  token?: string,
) {
  let jwt = token;
  if (!jwt) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("No authenticated user found. Please log in to continue.");
    }
    const session = await supabase.auth.getSession();
    jwt = session.data.session?.access_token ?? "";
  }
  const apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!jwt || !apikey) {
    console.warn(
      "Missing access_token or apikey – this will break RLS or Supabase auth.",
    );
  }
  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      "sb-access-token": jwt,
      Authorization: `Bearer ${jwt}`,
      apikey,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
}
