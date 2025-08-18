import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const PROD_COOKIE_DOMAIN =
  process.env.NODE_ENV === "production" ? ".yarnnn.com" : undefined;

export async function getServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({
            name,
            value,
            ...options,
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: true,
            domain: PROD_COOKIE_DOMAIN,
          });
        },
        remove(name: string, options: any) {
          cookieStore.set({
            name,
            value: "",
            ...options,
            path: "/",
            expires: new Date(0),
            domain: PROD_COOKIE_DOMAIN,
          });
        },
      },
    }
  );
}
