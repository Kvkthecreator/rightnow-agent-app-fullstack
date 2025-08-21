export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase/clients";
import { z, ZodError } from "zod";
import { createHash, randomUUID } from "node:crypto";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

function hash(v: string) {
  return createHash("sha256").update(v).digest("hex").slice(0, 8);
}

function safeDecode(token?: string) {
  try {
    if (!token) return { tokenClaims: {} };
    const [, p] = token.split(".");
    const payload = JSON.parse(Buffer.from(p, "base64").toString());
    return {
      tokenClaims: {
        iss: payload.iss,
        aud: payload.aud,
        sub_hash: payload.sub ? hash(payload.sub) : undefined,
        exp: payload.exp,
        iat: payload.iat,
        aal: payload.aal,
        amr: Array.isArray(payload.amr)
          ? payload.amr.map((m: any) => m.method)
          : undefined,
      },
    };
  } catch {
    return { tokenClaims: {} };
  }
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const { id: basketId } = await ctx.params;
    const DBG = req.headers.get("x-yarnnn-debug-auth") === "1";
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: { code: "INVALID_JSON", message: "Malformed JSON" } },
        { status: 400 }
      );
    }

    const hasMode = typeof body === "object" && body !== null && "mode" in body;
    let parsed: any;
    if (hasMode) {
      const NewSchema = z.object({
        mode: z.enum(["init_build", "evolve_turn"]),
        sources: z
          .array(
            z.object({
              type: z.string(),
              id: z.string(),
              content: z.string().optional(),
            })
          )
          .min(1, "sources must include at least one item"),
        policy: z
          .object({
            allow_structural_changes: z.boolean().optional(),
            preserve_blocks: z.array(z.string()).optional(),
            update_document_ids: z.array(z.string()).optional(),
            strict_link_provenance: z.boolean().optional(),
          })
          .optional(),
        options: z
          .object({
            fast: z.boolean().optional(),
            max_tokens: z.number().optional(),
            trace_req_id: z.string().optional(),
          })
          .optional(),
      });
      parsed = NewSchema.parse(body);
    } else {
      const LegacySchema = z.object({
        request_id: z.string(),
        basket_id: z.string().uuid(),
        intent: z.string().optional(),
        sources: z
          .array(z.object({ type: z.string(), id: z.string().optional() }))
          .optional(),
      });
      parsed = LegacySchema.parse(body);
    }

    const supabase = createRouteHandlerClient({ cookies });
    await getAuthenticatedUser(supabase);
    const accessToken =
      req.headers.get("sb-access-token") ||
      req.headers.get("authorization")?.replace("Bearer ", "");
    if (!accessToken) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Missing authentication" } },
        { status: 401 }
      );
    }
    const requestId = req.headers.get("x-request-id") ?? randomUUID();

    const res = await fetch(`${API_BASE}/api/baskets/${basketId}/work`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "sb-access-token": accessToken,
        "x-request-id": requestId,
        ...(DBG ? { "x-yarnnn-debug-auth": "1" } : {}),
      },
      body: JSON.stringify(parsed),
    });

    const text = await res.text();
    if (!res.ok && DBG) {
      return NextResponse.json(
        { error: { code: "UPSTREAM", message: "Upstream error" }, debug: safeDecode(accessToken).tokenClaims },
        { status: res.status }
      );
    }

    return new NextResponse(text, { status: res.status });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", details: error.errors } },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { error: { code: "UPSTREAM", message: "API bridge failed" } },
      { status: 500 }
    );
  }
}
