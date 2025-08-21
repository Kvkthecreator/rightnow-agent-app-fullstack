import { NextResponse, NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const canonical = process.env.NEXT_PUBLIC_CANONICAL_HOST
  const host = req.headers.get('host')
  if (canonical && host && host !== canonical) {
    const url = req.nextUrl
    url.host = canonical
    return NextResponse.redirect(url)
  }

  const m = req.nextUrl.pathname.match(/^\/baskets\/([^/]+)(\/.*)?$/)
  if (m) {
    const reqId = m[1]
    const tail = m[2] || '/memory'
    try {
      const upstream = await fetch(new URL('/api/baskets/resolve', req.nextUrl.origin), {
        headers: { cookie: req.headers.get('cookie') ?? '' },
      })
      if (upstream.ok) {
        const { id } = await upstream.json()
        if (id && id !== reqId) {
          const next = new URL(`/baskets/${id}${tail}`, req.nextUrl)
          return NextResponse.redirect(next)
        }
      }
    } catch {
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = { matcher: '/((?!_next|favicon.ico|api).*)' }
