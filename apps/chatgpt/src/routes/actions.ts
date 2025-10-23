import { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { CreateAuditedGtmBriefInput } from '../lib/schemas.js';
import { composeBrief, verifyConnection } from '../lib/client.js';
import { logger } from '../lib/logger.js';

function extractBearer(req: IncomingMessage): string | null {
  const header = req.headers['authorization'];
  const raw = Array.isArray(header) ? header[0] : header;
  if (!raw) {
    return null;
  }
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) {
    return {};
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error('invalid_json');
  }
}

export async function handleActions(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const tool = url.searchParams.get('tool');
  const token = extractBearer(req);

  if (!tool) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'missing_tool' }));
    return;
  }

  if (!token) {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Bearer realm="Yarnnn"');
    res.end(JSON.stringify({ error: 'missing_token' }));
    return;
  }

  try {
    if (tool === 'connect_yarnnn') {
      const info = await verifyConnection(token);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, info }));
      return;
    }

    if (tool === 'create_audited_gtm_brief') {
      const payload = await readJsonBody(req);
      const input = CreateAuditedGtmBriefInput.parse(payload);
      const brief = await composeBrief(token, input);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(brief));
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'unknown_tool' }));
  } catch (error) {
    logger.warn('Action failed', { tool, error });
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'bad_request' }));
  }
}
