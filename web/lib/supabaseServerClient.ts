import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./dbTypes";
import { cookies } from "next/headers";

export const createServerSupabaseClient = (): SupabaseClient<Database> =>
  createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { cookies }
  );
