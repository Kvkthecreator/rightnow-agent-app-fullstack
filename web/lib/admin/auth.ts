import crypto from 'node:crypto';

const ADMIN_USER = process.env.BASKET_MODE_ADMIN_USER;
const ADMIN_PASS = process.env.BASKET_MODE_ADMIN_PASS;
const COOKIE_NAME = 'basket_mode_admin';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function getSecret(): string {
  const secret =
    process.env.BASKET_MODE_ADMIN_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_JWT_SECRET;

  if (!secret) {
    throw new Error(
      'Basket mode admin secret missing. Set BASKET_MODE_ADMIN_SECRET or reuse NEXTAUTH_SECRET.',
    );
  }

  return secret;
}

function sign(value: string): string {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
}

function encode(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json).toString('base64url');
}

function decode<T>(token: string): T | null {
  try {
    const json = Buffer.from(token, 'base64url').toString('utf8');
    return JSON.parse(json) as T;
  } catch (error) {
    console.warn('[basket-mode-admin] Failed to decode token', error);
    return null;
  }
}

export function credentialsConfigured(): boolean {
  return Boolean(ADMIN_USER && ADMIN_PASS);
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  if (!credentialsConfigured()) {
    throw new Error('Admin credentials not configured. Set BASKET_MODE_ADMIN_USER/PASS.');
  }
  return username === ADMIN_USER && password === ADMIN_PASS;
}

export function createAdminSessionToken(): string {
  const payload = encode({ iat: Date.now(), sub: ADMIN_USER });
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function isValidAdminSession(token?: string | null): boolean {
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  if (sign(payload) !== signature) return false;

  const data = decode<{ iat?: number }>(payload);
  if (!data?.iat) return false;

  const age = Date.now() - data.iat;
  return age >= 0 && age < SESSION_TTL_MS;
}

export function getAdminCookieName(): string {
  return COOKIE_NAME;
}

export function getSessionTtl(): number {
  return SESSION_TTL_MS;
}
