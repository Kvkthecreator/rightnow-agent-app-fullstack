import { apiClient, timeoutSignal } from './http';

export interface CreateDumpInput {
  basketId: string;
  text?: string | null;
  fileUrls?: string[] | null;
  meta?: Record<string, unknown> | null;
}

export async function createDump({ basketId, text, fileUrls, meta }: CreateDumpInput): Promise<{ dumpId: string }> {
  const ingestTraceId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const dumpRequestId = ingestTraceId;

  const body = {
    basket_id: basketId,
    text_dump: text ?? null,
    file_urls: fileUrls ?? null,
    source_meta: {
      ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      ...meta,
    },
    ingest_trace_id: ingestTraceId,
    dump_request_id: dumpRequestId,
  };

  const res = (await apiClient({
    url: '/api/dumps/new',
    method: 'POST',
    body,
    signal: timeoutSignal(20000),
  })) as { dump_id: string };

  if (!res.dump_id) {
    throw new Error('Missing dump_id in response');
  }
  return { dumpId: res.dump_id };
}
