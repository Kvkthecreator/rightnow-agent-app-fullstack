import { sql } from "@/lib/db";
export async function GET() {
  const off = await sql/* sql */`
    select pipeline_name, last_event_id, last_event_ts, updated_at
    from public.pipeline_offsets
    where pipeline_name = 'p3_reflections_consumer'
  `;
  return new Response(JSON.stringify(off.rows?.[0] || {}), { headers: { "content-type": "application/json" } });
}