import {
  createClientComponentClient,
  createServerComponentClient as createNextServerComponentClient,
  createRouteHandlerClient as createNextRouteHandlerClient,
} from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/dbTypes';

let browserClient: SupabaseClient<Database> | undefined;

export const createBrowserClient = (): SupabaseClient<Database> => {
  if (!browserClient) browserClient = createClientComponentClient<Database>();
  return browserClient;
};

export const createServerComponentClient = ({ cookies }: { cookies: any }): SupabaseClient<Database> =>
  createNextServerComponentClient<Database>({ cookies });

export const createRouteHandlerClient = ({ cookies }: { cookies: any }): SupabaseClient<Database> =>
  createNextRouteHandlerClient<Database>({ cookies });
