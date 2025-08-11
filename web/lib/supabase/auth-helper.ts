/**
 * Supabase Authentication Helper
 * Ensures proper authentication for Realtime connections while preserving workspace membership
 */

import { createSupabaseClient } from './client'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/dbTypes'

export class SupabaseAuthHelper {
  private static instance: SupabaseAuthHelper
  private client = createSupabaseClient()
  
  static getInstance() {
    if (!SupabaseAuthHelper.instance) {
      SupabaseAuthHelper.instance = new SupabaseAuthHelper()
    }
    return SupabaseAuthHelper.instance
  }
  
  /**
   * Get authenticated user with proper validation
   * Uses supabase.auth.getUser() instead of getSession() for security
   */
  async getAuthenticatedUser() {
    try {
      const { data: { user }, error } = await this.client.auth.getUser()
      
      if (error) {
        console.error('Authentication error:', error.message)
        return null
      }
      
      if (!user) {
        console.warn('No authenticated user found')
        return null
      }
      
      return user
    } catch (error) {
      console.error('Failed to get authenticated user:', error)
      return null
    }
  }
  
  /**
   * Get workspace ID for a basket
   */
  async getWorkspaceIdForBasket(basketId: string): Promise<string | null> {
    try {
      const { data, error } = await this.client
        .from('baskets')
        .select('workspace_id')
        .eq('id', basketId)
        .single()
      
      if (error) {
        console.error('Failed to get workspace for basket:', error)
        return null
      }
      
      return data?.workspace_id || null
    } catch (error) {
      console.error('Error getting workspace for basket:', error)
      return null
    }
  }

  /**
   * Check if user has access to a specific workspace
   * This preserves your workspace membership approach
   */
  async checkWorkspaceAccess(workspaceId: string) {
    try {
      const user = await this.getAuthenticatedUser()
      if (!user) return false
      
      // Query workspace_memberships table with RLS policies
      const { data, error } = await this.client
        .from('workspace_memberships')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - user not a member
          return false
        }
        console.error('Workspace access check failed:', error)
        return false
      }
      
      return !!data
    } catch (error) {
      console.error('Workspace access check error:', error)
      return false
    }
  }

  /**
   * Check if user has access to a basket (via workspace membership)
   */
  async checkBasketAccess(basketId: string) {
    const workspaceId = await this.getWorkspaceIdForBasket(basketId)
    if (!workspaceId) return false
    
    return this.checkWorkspaceAccess(workspaceId)
  }
  
  /**
   * Get current session with proper token validation
   */
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await this.client.auth.getSession()
      
      if (error) {
        console.error('Session error:', error.message)
        return null
      }
      
      // Additional validation: check if token is expired
      if (session?.expires_at && Date.now() / 1000 > session.expires_at) {
        console.warn('Session token expired, refreshing...')
        
        const { data: { session: refreshedSession } } = await this.client.auth.refreshSession()
        return refreshedSession
      }
      
      return session
    } catch (error) {
      console.error('Failed to get current session:', error)
      return null
    }
  }
  
  /**
   * Setup authenticated realtime client with explicit session token
   * Creates a new client instance with the current authenticated session
   */
  async getAuthenticatedClient() {
    // Get current session to ensure we have valid auth
    const session = await this.getCurrentSession()
    
    console.log('[DEBUG] Getting authenticated client')
    console.log('[DEBUG] Current session:', session ? 'exists' : 'null')
    console.log('[DEBUG] Session user:', session?.user?.id)
    console.log('[DEBUG] Session token expires at:', new Date((session?.expires_at || 0) * 1000))
    console.log('[DEBUG] Access token (first 50 chars):', session?.access_token?.substring(0, 50))
    
    if (!session) {
      console.error('[DEBUG] No session available for realtime connection')
      return null
    }
    
    // Log the JWT payload to see what role we have
    try {
      const tokenPayload = JSON.parse(atob(session.access_token.split('.')[1]))
      console.log('[DEBUG] JWT role:', tokenPayload.role)
      console.log('[DEBUG] JWT aud:', tokenPayload.aud)
      console.log('[DEBUG] JWT exp:', new Date(tokenPayload.exp * 1000))
    } catch (e) {
      console.warn('[DEBUG] Could not parse JWT token:', e)
    }
    
    // Create a new client instance with explicit auth for Realtime
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log('[DEBUG] Creating explicit authenticated client for Realtime')
    
    const authenticatedClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Don't persist to avoid conflicts
        detectSessionInUrl: false
      },
      realtime: {
        params: {
          // Explicitly pass the access token to Realtime
          apikey: session.access_token
        }
      }
    })
    
    // Set the session on the new client
    await authenticatedClient.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    })
    
    console.log('[DEBUG] Authenticated client created and session set')
    
    return authenticatedClient
  }
}

export const authHelper = SupabaseAuthHelper.getInstance()