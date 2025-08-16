import fs from 'fs';

function extractRef(url) {
  const match = url?.match(/^https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const jwksUrl = process.env.SUPABASE_JWKS_URL;
const issuer = process.env.SUPABASE_JWKS_ISSUER;

if (!supabaseUrl || !jwksUrl || !issuer) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const refUrl = extractRef(supabaseUrl);
const refJwks = extractRef(jwksUrl);
const refIssuer = extractRef(issuer);

if (!refUrl || refUrl !== refJwks || refUrl !== refIssuer) {
  console.error('Supabase project refs mismatch');
  process.exit(1);
}

const route = fs.readFileSync('web/app/api/baskets/new/route.ts', 'utf8');
if (!route.includes('export const runtime = "nodejs"')) {
  console.error('web/app/api/baskets/new/route.ts missing runtime export');
  process.exit(1);
}

console.log('Auth handshake check passed');
