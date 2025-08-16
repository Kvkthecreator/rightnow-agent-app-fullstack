export const runtime = "nodejs";

import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { CreateDumpReq, CreateDumpRes } from "@shared/contracts/dumps";
import { CreateDumpReqSchema } from "@/lib/schemas/dumps";

/**
 * Interface Spec v0.1.0 compliant: POST /api/dumps/new
 * Accepts CreateDumpReq with idempotency via dump_request_id
 */

export async function POST(req: Request) {
  const startTime = Date.now();
  const reqId = req.headers.get("X-Req-Id") || `ui-${Date.now()}`;
  
  try {
    // Parse and validate request body against spec
    const rawBody = await req.json();
    const validationResult = CreateDumpReqSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.error("dumps/new validation error:", validationResult.error);
      return Response.json(
        { error: { code: "INVALID_INPUT", message: "Invalid request format", details: validationResult.error.format() } },
        { status: 400 }
      );
    }

    const { basket_id, dump_request_id, text_dump, file_url, meta } = validationResult.data;

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      console.error("dumps/new unauthorized", { reqId });
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required", details: {} } },
        { status: 401 }
      );
    }

    // Verify basket exists and user has access via workspace membership
    const { data: basket } = await supabase
      .from("baskets")
      .select(`
        id,
        workspace_id,
        workspace_memberships!inner(user_id)
      `)
      .eq("id", basket_id)
      .eq("workspace_memberships.user_id", session.user.id)
      .single();

    if (!basket) {
      console.error("dumps/new basket not found or access denied:", { basket_id, userId: session.user.id });
      return Response.json(
        { error: { code: "BASKET_NOT_FOUND", message: "Basket not found or access denied", details: {} } },
        { status: 404 }
      );
    }

    // Check for existing dump with same idempotency key (replay detection)
    const { data: existingDump } = await supabase
      .from("raw_dumps")
      .select("id")
      .eq("basket_id", basket_id)
      .eq("dump_request_id", dump_request_id)
      .single();

    if (existingDump) {
      // Log replay event
      console.log(JSON.stringify({
        route: "/api/dumps/new",
        user_id: session.user.id,
        basket_id,
        dump_request_id,
        action: "replayed",
        dump_id: existingDump.id,
        duration_ms: Date.now() - startTime
      }));
      
      return Response.json(
        { dump_id: existingDump.id } satisfies CreateDumpRes,
        { status: 200 }
      );
    }

    // Validate content requirement
    if (!text_dump && !file_url) {
      return Response.json(
        { error: { code: "EMPTY_DUMP", message: "Either text_dump or file_url must be provided", details: {} } },
        { status: 422 }
      );
    }

    // Create new dump
    const { data: dump, error: createError } = await supabase
      .from("raw_dumps")
      .insert({
        basket_id,
        dump_request_id,
        workspace_id: basket.workspace_id,
        body_md: text_dump || null,
        file_url: file_url || null,
        source_meta: meta ? JSON.stringify(meta) : '{}',
        processing_status: 'unprocessed'
      })
      .select("id")
      .single();

    if (createError) {
      // Check for idempotency conflict (race condition)
      if (createError.code === "23505" && createError.message?.includes("uq_dumps_basket_req")) {
        console.error("dumps/new idempotency conflict:", createError);
        return Response.json(
          { error: { code: "IDEMPOTENCY_CONFLICT", message: "Duplicate dump_request_id for basket", details: {} } },
          { status: 409 }
        );
      }
      
      console.error("dumps/new creation error:", createError);
      return Response.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to create dump", details: { dbError: createError.message } } },
        { status: 500 }
      );
    }

    if (!dump) {
      console.error("dumps/new creation returned no data");
      return Response.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to create dump - no data returned", details: {} } },
        { status: 500 }
      );
    }

    // Log creation event
    console.log(JSON.stringify({
      route: "/api/dumps/new",
      user_id: session.user.id,
      basket_id,
      dump_request_id,
      action: "created",
      dump_id: dump.id,
      duration_ms: Date.now() - startTime
    }));

    return Response.json(
      { dump_id: dump.id } satisfies CreateDumpRes,
      { status: 201 }
    );

  } catch (e: any) {
    console.error("dumps/new route crash", { reqId, err: String(e?.message ?? e) });
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error", details: { error: e?.message || "Unknown error" } } },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

