import { headers, cookies } from 'next/headers';
import { env } from '@/lib/env'; // keep env single-source

const base = (env.API_BASE_URL ?? env.NEXT_PUBLIC_API_BASE_URL);
if (!base) throw new Error('API base URL not configured (set API_BASE_URL or NEXT_PUBLIC_API_BASE_URL)');
const API_BASE = base.replace(/\/+$/, '');

function requireAccessToken(): string {
  // Canon: headers first, then cookies
  const h = headers();
  const sb = h.get('sb-access-token');
  if (sb) return sb;

  const auth = h.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);

  const c = cookies().get('sb-access-token')?.value;
  if (c) return c;

  const e: any = new Error('NO_TOKEN');
  e.status = 401;
  throw e;
}

// Sends BOTH headers to the FastAPI backend
export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = requireAccessToken();
  const out = new Headers(init.headers || {});
  out.set('Authorization', `Bearer ${token}`);
  out.set('sb-access-token', token);
  if (!out.has('Content-Type') && init.body) out.set('Content-Type', 'application/json');
  if (process.env.NODE_ENV !== 'production') out.set('x-yarnnn-debug-auth', '1');
  return fetch(`${API_BASE}${path}`, { ...init, headers: out, cache: 'no-store' });
}

export const apiGet  = (p: string) => apiFetch(p, { method: 'GET' });
export const apiPost = (p: string, body?: unknown) =>
  apiFetch(p, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
export const apiPut  = (p: string, body?: unknown) =>
  apiFetch(p, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
