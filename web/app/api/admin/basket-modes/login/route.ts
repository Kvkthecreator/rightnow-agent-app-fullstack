import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  createAdminSessionToken,
  credentialsConfigured,
  getAdminCookieName,
  getSessionTtl,
  verifyAdminCredentials,
} from '@/lib/admin/auth';

export async function POST(request: NextRequest) {
  if (!credentialsConfigured()) {
    return NextResponse.json({ error: 'Admin credentials not configured' }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const username = body?.username;
  const password = body?.password;

  if (typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const valid = verifyAdminCredentials(username, password);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = createAdminSessionToken();
  const cookieStore = cookies();
  cookieStore.set(getAdminCookieName(), token, {
    maxAge: Math.floor(getSessionTtl() / 1000),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  return NextResponse.json({ ok: true });
}
