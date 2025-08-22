import { apiClient, timeoutSignal } from './http';

interface CreateDumpInput {
  basketId: string;
  text: string;
  fileUrls?: string[];
}

export async function createDump({ basketId, text, fileUrls }: CreateDumpInput): Promise<{ dumpId: string; eventId: string }> {
  const body = {
    basket_id: basketId,
    text_dump: text,
    file_urls: fileUrls,
  };
  const res = (await apiClient({
    url: '/api/dumps/new',
    method: 'POST',
    body,
    signal: timeoutSignal(20000),
  })) as { dump_id: string; event_id: string };
  return { dumpId: res.dump_id, eventId: res.event_id };
}
