// web/lib/supabaseClient.ts
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./dbTypes";

/**
 * “Factory” in case you ever need a fresh client
 * (e.g. inside server components or tests).
 */
export const createClient = (): SupabaseClient<Database> =>
  createPagesBrowserClient<Database>();

/**
 * Shared browser-side client for the whole app.
 * – carries the user’s session automatically
 * – attaches sb-access-token / Authorization headers
 */
export const supabase = createClient();

/* Optional: also export as default so you can
   `import supabase from "@/lib/supabaseClient";` if you prefer */
export default supabase;
