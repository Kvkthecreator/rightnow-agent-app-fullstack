import { AuditedGtmBrief, type CreateAuditedGtmBriefInputType, type AuditedGtmBriefType } from './schemas.js';
import { logger } from './logger.js';

const apiBase = process.env.YARNNN_API_URL;

if (!apiBase) {
  logger.warn('YARNNN_API_URL not configured; API client requests will fail');
}

export async function composeBrief(token: string, payload: CreateAuditedGtmBriefInputType): Promise<AuditedGtmBriefType> {
  if (!apiBase) {
    throw new Error('missing_api_base');
  }

  const response = await fetch(`${apiBase}/api/briefs/compose`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`compose_failed_${response.status}`);
  }

  const json = await response.json();
  return AuditedGtmBrief.parse(json);
}

export async function verifyConnection(token: string): Promise<unknown> {
  if (!apiBase) {
    throw new Error('missing_api_base');
  }

  const response = await fetch(`${apiBase}/api/integrations/openai/tokens/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`whoami_failed_${response.status}`);
  }

  return response.json();
}
