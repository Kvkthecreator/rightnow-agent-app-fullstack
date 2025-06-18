import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Block, Basket, Event } from './dbTypes';

type Database = {
  Block: Block;
  Basket: Basket;
  Event: Event;
};

export const createClient = (): SupabaseClient<Database> =>
  createPagesBrowserClient<Database>();
