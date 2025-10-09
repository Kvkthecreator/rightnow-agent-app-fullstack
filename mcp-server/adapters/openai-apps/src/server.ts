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
