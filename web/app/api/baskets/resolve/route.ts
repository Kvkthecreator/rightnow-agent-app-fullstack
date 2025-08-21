import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser'
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { userId } = await getAuthenticatedUser(supabase)
  const ws = await ensureWorkspaceForUser(userId, supabase)

  const { data, error } = await supabase
    .from('baskets')
    .select('id,status,created_at')
    .eq('workspace_id', ws.id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data || data.length === 0) return NextResponse.json({ error: 'no_basket' }, { status: 404 })
  return NextResponse.json({ id: data[0].id })
}
