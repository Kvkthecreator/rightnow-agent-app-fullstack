import { apiGet } from '@/lib/api';

export interface Snapshot {
  basket_id: string;
  raw_dump: { id: string; content?: string; body_md?: string } | null;
  constants: { id: string; content?: string }[];
  locked_blocks: { id: string; content?: string }[];
  accepted_blocks: { id: string; content?: string }[];
}

export async function getSnapshot(basketId: string): Promise<Snapshot> {
  return apiGet(`/api/baskets/${basketId}/snapshot`);
}
