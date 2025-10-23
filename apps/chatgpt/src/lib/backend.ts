import { logger } from './logger.js';
import type { EncryptedPayload } from './crypto.js';

const backendBase = process.env.YARNNN_API_URL;
const sharedSecret = process.env.MCP_SHARED_SECRET;

if (!backendBase) {
  logger.warn('YARNNN_API_URL not configured for backend calls');
}

if (!sharedSecret) {
  logger.warn('MCP_SHARED_SECRET not configured; token persistence will fail');
}

interface PersistTokenPayload {
  workspace_id: string;
  install_id?: string | null;
  expires_at?: string | null;
  scope?: string | null;
  encryption_version: number;
  access_token_enc: EncryptedPayload;
  refresh_token_enc?: EncryptedPayload | null;
  provider_metadata?: Record<string, unknown>;
}

export async function persistOpenAITokens(payload: PersistTokenPayload): Promise<void> {
  if (!backendBase) {
    throw new Error('missing_backend_base');
  }
  if (!sharedSecret) {
    throw new Error('missing_shared_secret');
  }

  const response = await fetch(`${backendBase}/api/integrations/openai/tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-yarnnn-mcp-secret': sharedSecret
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`token_persist_failed_${response.status}:${text}`);
  }
}
