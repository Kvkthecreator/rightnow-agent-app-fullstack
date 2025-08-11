import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/dbTypes'

// Ensure we're using the correct environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Never use localhost in production
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
    console.error('ERROR: Localhost URL detected in production!', supabaseUrl)
  }
}

export const createSupabaseClient = () => {
  // createClientComponentClient automatically handles:
  // - Authentication state from cookies/session storage
  // - Proper token refresh
  // - Workspace-based RLS policies
  const client = createClientComponentClient<Database>()
  
  // Client will handle realtime connections automatically with proper auth
  
  return client
}

// Export singleton for backward compatibility
export const supabase = createSupabaseClient()