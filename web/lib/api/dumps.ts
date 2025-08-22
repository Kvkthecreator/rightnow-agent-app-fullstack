import { apiClient, timeoutSignal } from './http';

export async function createDump(input: {
  basketId: string;
  text?: string | null;
  fileUrls?: string[] | null;
  meta?: Record<string, unknown> | null;
}): Promise<{ dumpId: string }> {
  const ingestTraceId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const dumpRequestId = ingestTraceId; // reuse for idempotency

  const body = {
    basket_id: input.basketId,
    text_dump: input.text ?? null,
    file_urls: input.fileUrls ?? null,
    source_meta: {
      ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      ...input.meta,
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

  return { dumpId: res.dump_id };
}
