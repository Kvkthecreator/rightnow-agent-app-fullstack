import { apiClient, timeoutSignal } from './http';

export interface CreateDumpInput {
  basketId: string;
  text?: string | null;
  fileUrl?: string | null;
  meta?: Record<string, unknown> | null;
}

export async function createDump({ basketId, text, fileUrl, meta }: CreateDumpInput): Promise<{ dumpId: string }> {
  const ingestTraceId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const dumpRequestId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

  const body = {
    basket_id: basketId,
    dump_request_id: dumpRequestId,
    text_dump: text ?? null,
    file_url: fileUrl ?? null,
    meta: {
      ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      ingest_trace_id: ingestTraceId,
      ...meta,
    },
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
