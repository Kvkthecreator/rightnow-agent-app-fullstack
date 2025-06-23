//web/lib/supabaseClient.ts
import { createServerClient } from "@supabase/ssr";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import type { Database } from "./dbTypes";

/**
 * “Factory” in case you ever need a fresh client
 * (e.g. inside server components or tests).
 */
export const createServerSupabaseClient = (
  cookies: ReadonlyRequestCookies | Headers,
): SupabaseClient<Database> =>
  createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies },
  );

export const createBrowserSupabaseClient = (): SupabaseClient<Database> =>
  createPagesBrowserClient<Database>();

// Legacy alias used throughout the codebase
export const createClient = createBrowserSupabaseClient;

/**
 * Shared browser-side client for the whole app.
 * – carries the user’s session automatically
 * – attaches sb-access-token / Authorization headers
 */
export const supabase = createClient();

/* Optional: also export as default so you can
   `import supabase from "@/lib/supabaseClient";` if you prefer */
export default supabase;
