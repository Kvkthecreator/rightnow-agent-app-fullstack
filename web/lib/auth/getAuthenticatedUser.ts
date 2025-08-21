import type { SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export async function getAuthenticatedUser(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) redirect('/login')
  return { userId: data.user.id }
}
