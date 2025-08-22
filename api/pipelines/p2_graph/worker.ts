import { sql } from "@/lib/db";
import { Edge, edgesFromDumpCreated, edgesFromContextBulkTagged, edgesFromBlockEvent } from "./rules";

// In your stack, P1 emits machine-consumable signals to `public.events` with free-form 'kind'
const KINDS = new Set(["dump.created","context.bulk_tagged","block.proposed","block.revised","block.accepted"]);

async function upsertEdges(basketId: string, edges: Edge[], idemKey?: string) {
  if (!edges.length) return { created: 0, ignored: 0 };
  const res = await sql/* sql */`
    select public.fn_relationship_upsert_bulk(
      ${basketId}::uuid,
      ${JSON.stringify(edges)}::jsonb,
      ${idemKey || null}
    ) as result
  `;
  return res.rows?.[0]?.result;
}

export async function handleEvent(ev: any) {
  const kind: string = ev.kind || "";
  if (!KINDS.has(kind)) return { skipped: true };

  let edges: Edge[] = [];
  if (kind === "dump.created") edges = edgesFromDumpCreated(ev);
  else if (kind === "context.bulk_tagged") edges = edgesFromContextBulkTagged(ev);
  else if (kind.startsWith("block.")) edges = edgesFromBlockEvent(ev);

  const basketId = ev.basket_id || ev.payload?.basket_id;
  const idem = ev.payload?.idem_key;
  const result = await upsertEdges(basketId, edges, idem);
  return { kind, count: edges.length, result };
}