import { createClientComponentClient, createServerComponentClient, createRouteHandlerClient as createNextRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/dbTypes';
import { cookies as nextCookies } from 'next/headers';

let browserClient: SupabaseClient<Database> | undefined;

export const createBrowserClient = (): SupabaseClient<Database> => {
  if (!browserClient) browserClient = createClientComponentClient<Database>();
  return browserClient;
};

export const createServerComponentClient = ({ cookies }: { cookies: any }): SupabaseClient<Database> =>
  createServerComponentClient<Database>({ cookies });

export const createRouteHandlerClient = ({ cookies }: { cookies: any }): SupabaseClient<Database> =>
  createNextRouteHandlerClient<Database>({ cookies });

export const createClient = createBrowserClient;
export const createSupabaseClient = createBrowserClient;
export const createServerSupabaseClient = () => createServerComponentClient({ cookies: nextCookies });
export const createRouteHandlerSupabaseClient = () => createRouteHandlerClient({ cookies: nextCookies });
export const supabase = createBrowserClient();

export default supabase;
