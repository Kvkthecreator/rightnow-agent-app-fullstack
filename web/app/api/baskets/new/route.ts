// web/app/api/baskets/new/route.ts
export const runtime = "nodejs"; // avoid Edge so supabase-helpers work
export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { CreateBasketReqSchema } from "@/lib/schemas/baskets";
import { randomUUID } from "node:crypto";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function POST(req: NextRequest) {
  const DBG = req.headers.get("x-yarnnn-debug-auth") === "1";
  const requestId = req.headers.get("x-request-id") ?? randomUUID();
  // 1) Parse & validate request (canon: { idempotency_key, intent, raw_dump, notes? })
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Malformed JSON" } },
      { status: 400 }
    );
  }
  const parsed = CreateBasketReqSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Request failed validation",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  // 2) Get Supabase session from server-side cookies (refresh-safe)
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Missing session" } },
      { status: 401 }
    );
  }

  const accessToken = session.access_token;

  // 3) Forward to FastAPI with Bearer token (workspace bootstrap is server-side)
  // Forward canonical payload to FastAPI
  const payload = parsed.data;
  const upstream = await fetch(`${API_BASE}/api/baskets/new`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "sb-access-token": accessToken,
      "x-request-id": requestId,
      ...(DBG ? { "x-yarnnn-debug-auth": "1" } : {}),
    },
    body: JSON.stringify(payload),
  });

  const text = await upstream.text();
  if (!upstream.ok && DBG) {
    return NextResponse.json(
      {
        error: { code: "UPSTREAM", message: "Auth failed" },
        debug: {
          location: "baskets/new -> FastAPI",
          upstream: (() => {
            try {
              return JSON.parse(text);
            } catch {
              return { raw: text.slice(0, 200) };
            }
          })(),
        },
      },
      { status: upstream.status }
    );
  }

  return new NextResponse(text, { status: upstream.status });
}
