/**
 * Component: ServerIngest
 * Server-side ingest operations
 * @contract input  : IngestItem
 * @contract output : IngestRes
 */
import { createUserClient } from '@/lib/supabase/user';
import type { IngestRes, IngestItem } from '@shared/contracts/ingest';
import { IngestResSchema } from '@/lib/schemas/ingest';

interface IngestArgs {
  workspaceId: string;
  userId: string;
  idempotency_key: string;
  basket?: { name?: string };
  dumps: IngestItem[];
  token: string;
  batch_id?: string;
  comprehensive_review?: boolean;
}

export async function ingestBasketAndDumps(
  args: IngestArgs
): Promise<{ raw: unknown; data: IngestRes }> {
  const supabase = createUserClient(args.token);
  // Add batch metadata to dumps for comprehensive review
  const enrichedDumps = args.dumps.map(dump => ({
    ...dump,
    meta: {
      ...dump.meta,
      ...(args.batch_id && { batch_id: args.batch_id }),
      ...(args.comprehensive_review && { comprehensive_review: true })
    }
  }));
  
  const payload = {
    p_workspace_id: args.workspaceId,
    p_idempotency_key: args.idempotency_key,
    p_basket_name: args.basket?.name ?? null,
    p_dumps: JSON.stringify(enrichedDumps),
  };
  const { data, error } = await supabase.rpc('ingest_basket_and_dumps', payload);
  if (error) {
    throw new Error(error.message);
  }
  const parsed = IngestResSchema.parse(data);
  return { raw: data, data: parsed };
}
