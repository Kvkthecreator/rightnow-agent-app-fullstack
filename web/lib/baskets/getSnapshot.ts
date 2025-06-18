import { apiGet } from '@/lib/api';

export interface Snapshot {
  basket_id: string;
  raw_dumps: { id: string; content?: string; body_md?: string }[];
  blocks: { id: string; content?: string; state?: string }[];
}

export async function getSnapshot(basketId: string): Promise<Snapshot> {
  return apiGet(`/api/baskets/${basketId}/snapshot`);
}
