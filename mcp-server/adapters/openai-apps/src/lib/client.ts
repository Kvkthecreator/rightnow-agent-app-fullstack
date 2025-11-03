import { ComposeDocumentInput, ComposeDocumentResult, type ComposeDocumentInputType, type ComposeDocumentResultType } from './schemas.js';
import { logger } from './logger.js';

const apiBase = process.env.YARNNN_API_URL;

if (!apiBase) {
  logger.warn('YARNNN_API_URL not configured; API client requests will fail');
}

function mapWindow(window: ComposeDocumentInputType['window']): Record<string, unknown> | undefined {
  if (!window) {
    return undefined;
  }
  const mapped: Record<string, unknown> = {};
  if (window.daysBack) {
    mapped.days_back = window.daysBack;
  }
  if (window.anchors) {
    mapped.anchors = window.anchors;
  }
  if (window.keywords) {
    mapped.keywords = window.keywords;
  }
  return mapped;
}

export async function composeDocument(
  token: string,
  payload: ComposeDocumentInputType
): Promise<ComposeDocumentResultType> {
  if (!apiBase) {
    throw new Error('missing_api_base');
  }

  const response = await fetch(`${apiBase}/api/agents/p4-composition`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      basket_id: payload.basketId,
      intent: payload.intent,
      document_type: payload.documentType,
      operation: 'compose',
      window: mapWindow(payload.window),
      citations: payload.citations,
    })
  });

  if (!response.ok) {
    throw new Error(`compose_failed_${response.status}`);
  }

  const json = await response.json();
  return ComposeDocumentResult.parse(json);
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
