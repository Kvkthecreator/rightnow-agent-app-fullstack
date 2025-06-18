import { apiGet } from '@/lib/api';

export interface Block {
  id: string;
  content?: string;
  semantic_type?: string;
  state: string;
  scope?: string;
  canonical_value?: string;
}

export interface Snapshot {
  raw_dump: string;
  accepted_blocks: Block[];
  locked_blocks: Block[];
  constants: Block[];
}

export async function getSnapshot(basketId: string): Promise<Snapshot> {
  return apiGet(`/api/baskets/${basketId}/snapshot`);
}
