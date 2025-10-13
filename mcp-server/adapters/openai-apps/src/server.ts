#!/usr/bin/env node
/**
 * YARNNN OpenAI Apps Adapter (Scaffold)
 *
 * This adapter prepares the HTTP surface required by the OpenAI Apps SDK
 * while delegating core tool logic to @yarnnn/integration-core.
 *
 * TODO: Replace the stub routes with real Apps SDK wiring once OAuth and
 * component rendering requirements are finalised.
 */

import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';

import {
  getToolsList,
  selectBasket,
  type SessionFingerprint,
  type BasketCandidate,
} from '@yarnnn/integration-core';

import { config, logConfigSummary } from './config.js';

const app = express();
app.use(express.json());

logConfigSummary();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = path.resolve(__dirname, '..', 'static');

if (fs.existsSync(STATIC_DIR)) {
  app.use('/ui', express.static(STATIC_DIR));
}

const oauthStateStore = new Map<string, { workspaceId: string; createdAt: number }>();

/**
 * Health check used by Render and local smoke tests.
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', adapter: 'openai-apps', version: '0.1.0' });
});

/**
 * Temporary discovery endpoint so we can exercise the shared tool catalogue
 * without the Apps SDK.
 */
app.get('/tools', (_req: Request, res: Response) => {
  res.json({
    tools: getToolsList(),
    note: 'OpenAI Apps SDK wiring pending implementation',
  });
});

app.get('/tool-registry', async (_req: Request, res: Response) => {
  const toolsList = await getToolsList();
  const registry = toolsList.map((tool) => ({
    name: tool.name,
    description: tool.description.split('\n')[0],
    schema_note: 'See @yarnnn/integration-core tool definitions for full schema',
    requiresFingerprint: ['create_memory_from_chat', 'add_to_substrate'].includes(tool.name),
  }));
  res.json({ tools: registry });
});

app.get('/oauth/start', (req: Request, res: Response) => {
  if (!config.clientId || !config.redirectUri) {
    res.status(501).json({
      status: 'not_configured',
      message: 'Set OPENAI_CLIENT_ID and OPENAI_REDIRECT_URI to enable OAuth.',
    });
    return;
  }

  const workspaceId = String(req.query.workspace_id || '').trim();
  if (!workspaceId) {
    res.status(400).json({ status: 'error', message: 'workspace_id query parameter is required' });
    return;
  }

  const state = randomUUID();
  cleanupOAuthState();
  oauthStateStore.set(state, { workspaceId, createdAt: Date.now() });

  const authorizeUrl = new URL('https://chat.openai.com/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', config.clientId);
  authorizeUrl.searchParams.set('redirect_uri', config.redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'apps.tools.read apps.tools.write');
  authorizeUrl.searchParams.set('state', state);

  res.json({
    status: 'ok',
    authorize_url: authorizeUrl.toString(),
    state,
  });
});

app.get('/oauth/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;
  if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
    res.status(400).json({ status: 'error', message: 'Missing code or state' });
    return;
  }

  const entry = oauthStateStore.get(state);
  if (!entry) {
    res.status(400).json({ status: 'error', message: 'Unknown or expired state' });
    return;
  }

  oauthStateStore.delete(state);

  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    res.status(501).json({
      status: 'not_configured',
      message: 'OAuth client credentials are not configured; cannot exchange authorization code.',
    });
    return;
  }

  try {
    const tokenResponse = await exchangeAuthorizationCode(code);
    await persistTokens(entry.workspaceId, tokenResponse);

    res.status(200).json({
      status: 'linked',
      workspace_id: entry.workspaceId,
      expires_in: tokenResponse.expires_in,
      scope: tokenResponse.scope,
      install_id: tokenResponse.install_id,
    });
  } catch (error) {
    console.error('[OAUTH] Token exchange failed', error);
    res.status(502).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'OAuth exchange failed',
    });
  }
});

app.get('/ui-shell', (_req: Request, res: Response) => {
  const indexPath = path.join(STATIC_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    res.status(503).json({
      status: 'ui_not_built',
      message: 'Build the Apps UI bundle with `npm run build:ui` before accessing the shell.',
    });
    return;
  }
  res.sendFile(indexPath);
});

function cleanupOAuthState() {
  const cutoff = Date.now() - 10 * 60 * 1000; // 10 minutes
  for (const [state, record] of oauthStateStore.entries()) {
    if (record.createdAt < cutoff) {
      oauthStateStore.delete(state);
    }
  }
}

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  install_id?: string;
  [key: string]: unknown;
}

async function exchangeAuthorizationCode(code: string): Promise<OAuthTokenResponse> {
  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    throw new Error('OAuth client credentials missing');
  }

  const payload = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch('https://chat.openai.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token endpoint returned ${response.status}: ${text}`);
  }

  return (await response.json()) as OAuthTokenResponse;
}

async function persistTokens(workspaceId: string, tokens: OAuthTokenResponse) {
  if (!config.sharedSecret) {
    console.warn('[OAUTH] MCP_SHARED_SECRET not configured; skipping token persistence');
    return;
  }

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : undefined;

  const response = await fetch(`${config.backendUrl}/api/integrations/openai/tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-yarnnn-mcp-secret': config.sharedSecret,
    },
    body: JSON.stringify({
      workspace_id: workspaceId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      scope: tokens.scope,
      install_id: tokens.install_id,
      provider_metadata: {
        token_type: tokens.token_type,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to persist tokens: ${response.status} ${text}`);
  }
}

/**
 * Placeholder route for tool execution. For now it simply returns 501 so 
 * callers know the adapter is scaffolded but incomplete.
 */
app.post('/tools/:name', (req: Request, res: Response) => {
  void logBasketSelectionPlaceholder(req.body);
  res.status(501).json({
    status: 'not_implemented',
    tool: req.params.name,
    message: 'Apps SDK tool execution is not implemented yet. Use the Anthropic adapter until this route is completed.',
    receivedInput: req.body,
  });
});

app.listen(config.port, () => {
  console.log(`[SERVER] OpenAI Apps adapter listening on http://0.0.0.0:${config.port}`);
});

async function logBasketSelectionPlaceholder(payload: any) {
  const fingerprint = extractFingerprint(payload);
  if (!fingerprint) {
    return;
  }
  const selection = selectBasket(fingerprint, [] as BasketCandidate[]);
  console.log('[BASKET] OpenAI placeholder selection', selection.decision);
}

function extractFingerprint(payload: any): SessionFingerprint | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const fp = payload.session_fingerprint;
  if (!fp || !Array.isArray(fp.embedding)) {
    return null;
  }
  return {
    embedding: fp.embedding,
    summary: fp.summary,
    intent: fp.intent,
    entities: fp.entities,
    keywords: fp.keywords,
  };
}
