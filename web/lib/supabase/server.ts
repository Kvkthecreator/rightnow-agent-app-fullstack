import { createClient } from '@supabase/supabase-js';
import type { Block, Basket, Event } from '../dbTypes';

type Database = {
  Block: Block;
  Basket: Basket;
  Event: Event;
};

export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
