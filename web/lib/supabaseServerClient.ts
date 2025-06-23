// web/lib/supabaseServerClient.ts
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./dbTypes";
import { cookies } from "next/headers";

export const createServerSupabaseClient = (): SupabaseClient<Database> =>
  createServerComponentClient<Database>({ cookies });
