import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const publicPaths = ['/', '/about', '/landing', '/login', '/auth'];
  const isPublic = publicPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/about', req.url));
  }

  return res;
}

export const config = {
  matcher: '/((?!_next|favicon.ico|api).*)',
};
