import { loadProjection } from "./projection";
import { computeReflections } from "./engine";
import { sql } from "@/lib/db";

export async function runP3ComputeReflections(basketId: string, opts?: { days?: number; maxDumps?: number; cache?: boolean }) {
  const projection = await loadProjection({ basketId, days: opts?.days, maxDumps: opts?.maxDumps });
  const result = computeReflections(projection);

  let cached = false;
  if (opts?.cache) {
    const res = await sql/* sql */`
      select public.fn_reflection_cache_upsert(
        ${basketId}::uuid,
        ${result.pattern},
        ${result.tension},
        ${result.question},
        ${result.meta_derived_from}
      ) as changed
    `;
    cached = !!res.rows?.[0]?.changed;
  }

  // Emit metrics
  await sql/* sql */`
    insert into public.pipeline_metrics (pipeline, basket_id, counts, dims)
    values ('p3', ${basketId}::uuid,
            ${JSON.stringify({ edgeCount: projection.edges.length, cached: cached ? 1 : 0 })}::jsonb,
            ${JSON.stringify({ window: projection.window, meta: result.meta_derived_from })}::jsonb);
  `;

  return { projection: { window: projection.window, edgeCount: projection.edges.length }, reflection: result, cached };
}