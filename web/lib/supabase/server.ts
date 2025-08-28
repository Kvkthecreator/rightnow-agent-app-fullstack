import { cookies } from 'next/headers'
import { createTestAwareClient } from '@/lib/auth/testHelpers'

export function createServerSupabaseClient() {
  return createTestAwareClient({ cookies })
}
