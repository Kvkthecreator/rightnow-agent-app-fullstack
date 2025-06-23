import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./dbTypes";

export const createBrowserSupabaseClient = (): SupabaseClient<Database> =>
  createPagesBrowserClient<Database>();

export const createClient = createBrowserSupabaseClient;

export const supabase = createClient();

export default supabase;
