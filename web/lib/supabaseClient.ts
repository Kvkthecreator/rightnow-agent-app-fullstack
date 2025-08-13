import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./dbTypes";
import { dlog } from './dev/log';

// Global singleton instance
let globalSupabaseClient: SupabaseClient<Database> | null = null;

export const createBrowserSupabaseClient = (): SupabaseClient<Database> => {
  // Return existing singleton if available
  if (globalSupabaseClient) {
    dlog('supabase/singleton-reuse', { 
      clientId: (globalSupabaseClient as any)._clientId || 'unknown',
      timestamp: Date.now() 
    });
    return globalSupabaseClient;
  }
  
  // Create new client and store as singleton
  globalSupabaseClient = createPagesBrowserClient<Database>();
  
  // Add unique identifier for tracking
  (globalSupabaseClient as any)._clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  
  dlog('supabase/singleton-create', { 
    clientId: (globalSupabaseClient as any)._clientId,
    timestamp: Date.now() 
  });
  
  return globalSupabaseClient;
};

export const createClient = createBrowserSupabaseClient;

export const supabase = createClient();

export default supabase;
