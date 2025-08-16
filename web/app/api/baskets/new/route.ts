// web/app/api/baskets/new/route.ts
export const runtime = "nodejs"; // avoid Edge so supabase-helpers work
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { CreateBasketReqSchema } from "@/lib/schemas/baskets";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.yarnnn.com";

export async function POST(req: NextRequest) {
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

  // 2) Get Supabase access token from server-side cookies
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    console.error("baskets/new: No session found in server-side cookies");
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Missing session" } },
      { status: 401 }
    );
  }
  const accessToken = session.access_token;
  console.log("baskets/new: Token forwarding", { 
    hasToken: !!accessToken, 
    tokenPrefix: accessToken?.substring(0, 20) + "...",
    apiBase: API_BASE 
  });

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
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  
  // Log response for debugging
  console.log("baskets/new: FastAPI response", { 
    status: res.status, 
    body: text.substring(0, 200) + (text.length > 200 ? "..." : "")
  });
  
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}
