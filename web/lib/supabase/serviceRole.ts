import { createClient } from '@supabase/supabase-js';
import type { Block, Basket, Event } from '../dbTypes';

type Database = {
  Block: Block;
  Basket: Basket;
  Event: Event;
};

export function createServiceRoleClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient<Database>(url, key, { auth: { persistSession: false } });
}
