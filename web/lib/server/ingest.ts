import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import type { IngestRes, IngestItem } from '@shared/contracts/ingest';
import { IngestResSchema } from '@/lib/schemas/ingest';

interface IngestArgs {
  workspaceId: string;
  userId: string;
  idempotency_key: string;
  basket?: { name?: string };
  dumps: IngestItem[];
}

export async function ingestBasketAndDumps(
  args: IngestArgs
): Promise<{ raw: unknown; data: IngestRes }> {
  const supabase = createServiceRoleClient();
  const payload = {
    p_workspace_id: args.workspaceId,
    p_idempotency_key: args.idempotency_key,
    p_basket_name: args.basket?.name ?? null,
    p_dumps: JSON.stringify(args.dumps),
  };
  const { data, error } = await supabase.rpc('ingest_basket_and_dumps', payload);
  if (error) {
    throw new Error(error.message);
  }
  const parsed = IngestResSchema.parse(data);
  return { raw: data, data: parsed };
}
