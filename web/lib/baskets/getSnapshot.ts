// web/lib/baskets/getSnapshot.ts
import { apiGet } from "@/lib/api";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/dbTypes";
import type { Block } from "@/types/block";

/** Shape returned by /api/baskets/{id}/snapshot */
export interface BasketSnapshot {
  basket: {
    id: string;
    name: string | null;
    created_at: string;
  };
  raw_dump_body: string;
  file_refs: string[];
  blocks: Block[];
  proposed_blocks: Block[];
}

const SNAPSHOT_PREFIX = "/api/baskets/snapshot";

export async function getSnapshot(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<BasketSnapshot> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  const res = await apiGet<any>(`${SNAPSHOT_PREFIX}/${id}`, token);
  const payload = res as any;
  const flatBlocks = [
    ...(payload.accepted_blocks ?? []),
    ...(payload.locked_blocks ?? []),
    ...(payload.constants ?? []),
    ...(payload.proposed_blocks ?? []),
  ];
  return {
    basket: payload.basket,
    raw_dump_body: payload.raw_dump,
    file_refs: payload.file_refs ?? [],
    blocks: flatBlocks,
    proposed_blocks: payload.proposed_blocks ?? [],
  };
}
