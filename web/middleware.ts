import { NextResponse, NextRequest } from 'next/server'
import { pipelineBoundaryMiddleware } from './middleware/pipelineBoundary'

export async function middleware(req: NextRequest) {
  // Apply pipeline boundary checks to API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const boundaryResponse = await pipelineBoundaryMiddleware(req, NextResponse.next());
    if (boundaryResponse.status === 422) {
      // Canon violation - return immediately
      return boundaryResponse;
    }
  }

  const canonical = process.env.NEXT_PUBLIC_CANONICAL_HOST
  const host = req.headers.get('host')
  if (canonical && host && host !== canonical) {
    const url = req.nextUrl
    url.host = canonical
    return NextResponse.redirect(url)
  }

  // Redirect old blocks URL to building-blocks (Canon compliance)
  if (req.nextUrl.pathname.includes('/blocks')) {
    const redirectUrl = req.nextUrl.pathname.replace('/blocks', '/building-blocks');
    return NextResponse.redirect(new URL(redirectUrl, req.url));
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
