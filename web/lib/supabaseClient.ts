// web/lib/supabaseClient.ts

import { createServerComponentClient, createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./dbTypes";
import { cookies } from "next/headers";

/**
 * Factory for server-side Supabase client
 * — Uses Next.js App Router's server component pattern
 */
export const createServerSupabaseClient = (): SupabaseClient<Database> =>
  createServerComponentClient<Database>({ cookies });

/**
 * Factory for browser-side Supabase client
 */
export const createBrowserSupabaseClient = (): SupabaseClient<Database> =>
  createPagesBrowserClient<Database>();

/**
 * Legacy alias used in client-side codebase
 */
export const createClient = createBrowserSupabaseClient;

/**
 * Shared browser-side client instance
 */
export const supabase = createClient();

export default supabase;
