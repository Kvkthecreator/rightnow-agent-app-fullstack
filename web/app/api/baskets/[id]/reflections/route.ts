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
    const url = new URL(req.url);
    const queryParams = GetParamsSchema.safeParse({
      cursor: url.searchParams.get('cursor') || undefined,
      limit: url.searchParams.get('limit') || undefined,
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

    const backend = process.env.BACKEND_URL;
    if (!backend) return Response.json({ error: 'backend_url_missing' }, { status: 500 });
    const url = new URL(`${backend}/api/reflections/baskets/${basket_id}`);
    url.searchParams.set('workspace_id', basket.workspace_id);
    url.searchParams.set('limit', String(limit));
    if (cursor) url.searchParams.set('cursor', cursor);
    if (shouldRefresh) url.searchParams.set('refresh', 'true');

    const resp = await fetch(url.toString());
    const data = await resp.json();
    return withSchema(GetReflectionsResponseSchema, data, { status: resp.status });
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