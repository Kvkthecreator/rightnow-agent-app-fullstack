import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './dbTypes';

export const createClient = (): SupabaseClient<Database> =>
  createPagesBrowserClient<Database>();
