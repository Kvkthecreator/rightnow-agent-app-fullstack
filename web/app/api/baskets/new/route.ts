// web/app/api/baskets/new/route.ts
export const runtime = "nodejs"; // avoid Edge so supabase-helpers work
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies, headers as nextHeaders } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { CreateBasketReqSchema } from "@/lib/schemas/baskets";
import crypto from "node:crypto";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.yarnnn.com";

function hash(v: string) {
  return crypto.createHash("sha256").update(v).digest("hex").slice(0, 8);
}

function safeDecode(token?: string) {
  try {
    if (!token) return {};
    const [h, p] = token.split(".");
    const header = JSON.parse(Buffer.from(h, "base64").toString());
    const payload = JSON.parse(Buffer.from(p, "base64").toString());
    return {
      tokenHeaderAlg: header.alg,
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
    return {};
  }
}

export async function POST(req: NextRequest) {
  const DBG = nextHeaders().get("x-yarnnn-debug-auth") === "1";
  // 1) Parse & validate request (canon: { idempotency_key, basket: { name? } })
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

  // 2) Get Supabase user and session from server-side cookies
  // Per canon: use getUser() for secure authentication
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }
  
  // Get session for access token
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "No access token" } },
      { status: 401 }
    );
  }

  const accessToken = session.access_token;

  // 3) Forward to FastAPI with Bearer token (workspace bootstrap is server-side)
  // Forward canonical payload to FastAPI
  const payload = {
    idempotency_key: parsed.data.idempotency_key,
    basket: parsed.data.basket,
  };
  const res = await fetch(`${API_BASE}/api/baskets/new`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "sb-access-token": accessToken,
      ...(DBG ? { "x-yarnnn-debug-auth": "1" } : {}),
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok && DBG) {
    const { tokenHeaderAlg, tokenClaims } = safeDecode(accessToken);
    return NextResponse.json(
      {
        error: { code: "UPSTREAM", message: "Auth failed" },
        debug: {
          location: "baskets/new -> FastAPI",
          apiUrl: `${API_BASE}/api/baskets/new`,
          tokenHeaderAlg,
          tokenClaims,
          upstream: (() => {
            try {
              return JSON.parse(text);
            } catch {
              return { raw: text.slice(0, 200) };
            }
          })(),
        },
      },
      { status: res.status }
    );
  }

  return new NextResponse(text, { status: res.status });
}
