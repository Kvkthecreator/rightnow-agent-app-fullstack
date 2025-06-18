import { apiGet } from '@/lib/api';

export interface Block {
  id: string;
  content?: string;
  state: string;
}

export interface Snapshot {
  basket_id: string;
  raw_dump: string;
  accepted_blocks: Block[];
  locked_blocks: Block[];
  constants: Block[];
}

export async function getSnapshot(basketId: string): Promise<Snapshot> {
  return apiGet(`/api/baskets/${basketId}/snapshot`);
}
