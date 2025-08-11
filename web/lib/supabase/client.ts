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
  
  // Add debug logging for client creation
  if (typeof window !== 'undefined') {
    console.log('[DEBUG] Creating Supabase client')
    
    // Log current authentication state
    client.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[DEBUG] Client session check:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        userId: session?.user?.id,
        error: error?.message
      })
      
      if (session?.access_token) {
        try {
          const tokenPayload = JSON.parse(atob(session.access_token.split('.')[1]))
          console.log('[DEBUG] Client JWT role:', tokenPayload.role)
          
          // If we have an authenticated session, log success
          if (tokenPayload.role === 'authenticated') {
            console.log('[DEBUG] ✅ Client has authenticated session')
          } else {
            console.log('[DEBUG] ⚠️ Client using anon role - may have limited permissions')
          }
        } catch (e) {
          console.warn('[DEBUG] Could not parse client JWT:', e)
        }
      } else {
        console.log('[DEBUG] ⚠️ No access token - client will use anon role')
      }
    })
  }
  
  return client
}

// Export singleton for backward compatibility
export const supabase = createSupabaseClient()