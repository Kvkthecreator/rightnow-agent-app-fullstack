import { cookies } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase/clients'

export function createServerSupabaseClient() {
  return createServerComponentClient({ cookies })
}
