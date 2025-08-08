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
  // createClientComponentClient doesn't accept these options directly
  // It automatically uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
  return createClientComponentClient<Database>()
}

// Export singleton for backward compatibility
export const supabase = createSupabaseClient()