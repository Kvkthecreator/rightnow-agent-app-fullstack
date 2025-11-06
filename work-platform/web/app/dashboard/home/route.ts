import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser'
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser'
import { listBasketsByWorkspace, pickMostRelevantBasket } from '@/lib/substrate/baskets'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient()
  const { userId } = await getAuthenticatedUser(supabase)
  const ws = await ensureWorkspaceForUser(userId, supabase)

  // Redirect to projects page instead of baskets
  return NextResponse.redirect(new URL('/projects', req.url))

  // Legacy basket redirect (disabled - now using projects)
  // const { data: baskets } = await listBasketsByWorkspace(ws.id)
  // if (!baskets?.length) {
  //   return NextResponse.redirect(new URL('/projects', req.url))
  // }
  // const target = await pickMostRelevantBasket(ws.id)
  // if (!target) {
  //   return NextResponse.redirect(new URL('/projects', req.url))
  // }
  // const res = NextResponse.redirect(new URL(`/baskets/${target.id}/overview`, req.url))
  // res.cookies.set(`lastBasketId::${ws.id}`, target.id, {
  //   httpOnly: true, sameSite: 'lax', path: '/',
  // })
  // return res
}
