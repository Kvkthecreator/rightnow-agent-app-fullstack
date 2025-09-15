export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase/clients";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { NextResponse } from 'next/server';
import { withSchema } from "@/lib/api/withSchema";
import { GetReflectionsResponseSchema } from "@/shared/contracts/reflections";
import { z } from "zod";

const GetParamsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  refresh: z.coerce.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: basket_id } = await params;
    const requestUrl = new URL(req.url);
    const queryParams = GetParamsSchema.safeParse({
      cursor: requestUrl.searchParams.get('cursor') || undefined,
      limit: requestUrl.searchParams.get('limit') || undefined,
    });

    if (!queryParams.success) {
      return Response.json({ error: "Invalid query parameters", details: queryParams.error.flatten() }, { status: 422 });
    }

    const { cursor, limit = 10, refresh = false } = queryParams.data;

    const supabase = createRouteHandlerClient({ cookies });
    const { userId } = await getAuthenticatedUser(supabase);

    // Resolve basket + workspace
    const { data: basket, error: bErr } = await supabase
      .from("baskets")
      .select("id, workspace_id")
      .eq("id", basket_id)
      .maybeSingle();
    if (bErr) return Response.json({ error: `Basket lookup failed: ${bErr.message}` }, { status: 400 });
    if (!basket) return Response.json({ error: "Basket not found" }, { status: 404 });

    // Verify membership
    const { data: membership, error: mErr } = await supabase
      .from("workspace_memberships")
      .select("id")
      .eq("workspace_id", basket.workspace_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (mErr) return Response.json({ error: `Membership check failed: ${mErr.message}` }, { status: 400 });
    if (!membership) return Response.json({ error: "Forbidden" }, { status: 403 });

    // Check for X-Force-Recompute header
    const forceRecompute = req.headers.get('X-Force-Recompute') === '1';
    const shouldRefresh = refresh || forceRecompute;

    const { getApiBaseUrl } = await import('@/lib/config/api');
    const backend = getApiBaseUrl();
    const backendUrl = new URL(`${backend}/api/reflections/baskets/${basket_id}`);
    backendUrl.searchParams.set('workspace_id', basket.workspace_id);
    backendUrl.searchParams.set('limit', String(limit));
    if (cursor) backendUrl.searchParams.set('cursor', cursor);
    if (shouldRefresh) backendUrl.searchParams.set('refresh', 'true');

    const authHeader = req.headers.get('authorization') || undefined;
    const resp = await fetch(backendUrl.toString(), {
      headers: {
        ...(authHeader ? { authorization: authHeader } : {}),
      },
    });
    const contentType = resp.headers.get('content-type') || '';
    let payload: any;
    if (contentType.includes('application/json')) {
      payload = await resp.json();
    } else {
      const text = await resp.text();
      try { payload = JSON.parse(text); } catch { payload = { error: 'Upstream error', details: text }; }
    }

    if (!resp.ok) {
      return Response.json(payload, { status: resp.status });
    }

    // Sanitize upstream payload to match our DTO (strip extra fields, normalize cursor)
    const sanitized = (() => {
      try {
        const asString = (v: any) => (typeof v === 'string' ? v : undefined);
        const asStringOrNull = (v: any) => (typeof v === 'string' ? v : null);

        const reflectionsRaw = Array.isArray((payload as any)?.reflections)
          ? (payload as any).reflections
          : [];

        const reflections = reflectionsRaw
          .map((r: any) => {
            const reflection_text = asString(r.reflection_text);
            const computation_timestamp = asString(r.computation_timestamp) ?? new Date().toISOString();
            return {
              id: r.id,
              basket_id: r.basket_id,
              workspace_id: r.workspace_id,
              reflection_text,
              substrate_hash: asString(r.substrate_hash),
              computation_timestamp,
              reflection_target_type: (typeof r.reflection_target_type === 'string' ? r.reflection_target_type : 'legacy'),
              reflection_target_id: asStringOrNull(r.reflection_target_id),
              reflection_target_version: asStringOrNull(r.reflection_target_version),
              substrate_window_start: asString(r.substrate_window_start),
              substrate_window_end: asString(r.substrate_window_end),
              meta: r.meta,
            };
          })
          .filter((row: any) => typeof row.reflection_text === 'string' && row.reflection_text.length > 0);

        const next_cursor = (payload as any)?.next_cursor ?? undefined;
        return {
          reflections,
          has_more: Boolean((payload as any)?.has_more),
          ...(next_cursor ? { next_cursor } : {}),
        };
      } catch {
        return payload as any;
      }
    })();

    return withSchema(GetReflectionsResponseSchema, sanitized, { status: resp.status });
  } catch (e: any) {
    return Response.json({ error: "Unexpected error", details: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Canon v1.3.1: Reflections are a derived read-model. No client write path.
  return new Response(null, { 
    status: 405, 
    headers: { 'Allow': 'GET, OPTIONS' } 
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
