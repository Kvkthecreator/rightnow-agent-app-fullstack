import { randomBytes, createHash, randomUUID } from 'node:crypto';
import { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { encryptSecret } from '../lib/crypto.js';
import { persistOpenAITokens } from '../lib/backend.js';
import { logger } from '../lib/logger.js';

interface OAuthStateEntry {
  workspaceId: string;
  codeVerifier: string;
  createdAt: number;
}

const stateStore = new Map<string, OAuthStateEntry>();
const STATE_TTL_MS = 10 * 60 * 1000;

function cleanupState() {
  const cutoff = Date.now() - STATE_TTL_MS;
  for (const [key, entry] of stateStore.entries()) {
    if (entry.createdAt < cutoff) {
      stateStore.delete(key);
    }
  }
}

function buildAuthorizeUrl(workspaceId: string, state: string, codeChallenge: string): string {
  const authUrl = process.env.OAUTH_AUTH_URL;
  const clientId = process.env.OPENAI_CLIENT_ID;
  const redirectUri = process.env.OPENAI_REDIRECT_URI;

  if (!authUrl || !clientId || !redirectUri) {
    throw new Error('oauth_not_configured');
  }

  const url = new URL(authUrl);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'read:blocks compose:briefs offline_access');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('workspace_id', workspaceId);
  return url.toString();
}

function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url');
}

function codeChallengeFromVerifier(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  install_id?: string;
  token_type?: string;
}

async function exchangeCode(code: string, codeVerifier: string): Promise<TokenResponse> {
  const tokenUrl = process.env.OAUTH_TOKEN_URL;
  const clientId = process.env.OPENAI_CLIENT_ID;
  const clientSecret = process.env.OPENAI_CLIENT_SECRET;
  const redirectUri = process.env.OPENAI_REDIRECT_URI;

  if (!tokenUrl || !clientId || !clientSecret || !redirectUri) {
    throw new Error('oauth_not_configured');
  }

  const payload = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier
  });

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`
    },
    body: payload
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`token_exchange_failed_${response.status}:${text}`);
  }

  return response.json() as Promise<TokenResponse>;
}

async function handleStart(url: URL, res: ServerResponse) {
  const workspaceId = (url.searchParams.get('workspace_id') ?? '').trim();
  if (!workspaceId) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'missing_workspace_id' }));
    return;
  }

  try {
    const state = randomUUID();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = codeChallengeFromVerifier(codeVerifier);

    cleanupState();
    stateStore.set(state, { workspaceId, codeVerifier, createdAt: Date.now() });

    const authorizeUrl = buildAuthorizeUrl(workspaceId, state, codeChallenge);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ authorize_url: authorizeUrl, state }));
  } catch (error) {
    logger.error('OAuth start failed', { error });
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'oauth_start_failed' }));
  }
}

async function handleCallback(url: URL, res: ServerResponse) {
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');

  if (!state || !code) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'missing_code_or_state' }));
    return;
  }

  const entry = stateStore.get(state);
  if (!entry) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'unknown_state' }));
    return;
  }

  stateStore.delete(state);

  try {
    const tokens = await exchangeCode(code, entry.codeVerifier);

    const accessEnc = encryptSecret(tokens.access_token);
    const refreshEnc = tokens.refresh_token ? encryptSecret(tokens.refresh_token) : null;

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    await persistOpenAITokens({
      workspace_id: entry.workspaceId,
      install_id: tokens.install_id ?? null,
      expires_at: expiresAt,
      scope: tokens.scope ?? null,
      encryption_version: 1,
      access_token_enc: accessEnc,
      refresh_token_enc: refreshEnc,
      provider_metadata: {
        token_type: tokens.token_type ?? 'Bearer'
      }
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'linked',
      workspace_id: entry.workspaceId,
      expires_at: expiresAt,
      scope: tokens.scope,
      install_id: tokens.install_id
    }));
  } catch (error) {
    logger.error('OAuth callback failed', { error });
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'token_exchange_failed' }));
  }
}

export async function handleOAuth(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  if (url.pathname === '/oauth/start') {
    await handleStart(url, res);
    return;
  }

  if (url.pathname === '/oauth/callback') {
    await handleCallback(url, res);
    return;
  }

  res.statusCode = 404;
  res.end('Not found');
}
