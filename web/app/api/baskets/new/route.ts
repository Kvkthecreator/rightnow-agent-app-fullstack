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

  // 2) Get Supabase user and session from server-side cookies
  // Per canon: use getUser() for secure authentication
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error("baskets/new: No authenticated user", userError);
    return NextResponse.json(
      { 
        error: { 
          code: "UNAUTHORIZED", 
          message: "Not authenticated",
          debug: {
            location: "baskets/new route handler",
            issue: "No authenticated user found",
            error: userError?.message
          }
        } 
      },
      { status: 401 }
    );
  }
  
  // Get session for access token
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    return NextResponse.json(
      { 
        error: { 
          code: "UNAUTHORIZED", 
          message: "No access token",
          debug: {
            location: "baskets/new route handler", 
            issue: "Session exists but no access token",
            hasUser: true,
            userId: user.id
          }
        } 
      },
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
  
  // If FastAPI returns 401, add debug info
  if (res.status === 401) {
    try {
      const errorData = JSON.parse(text);
      return NextResponse.json({
        ...errorData,
        debug: {
          location: "baskets/new -> FastAPI",
          apiBase: API_BASE,
          hasToken: !!accessToken,
          tokenPrefix: accessToken?.substring(0, 20) + "...",
          originalError: errorData
        }
      }, { status: 401 });
    } catch {
      // If response isn't JSON, return as-is
    }
  }
  
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}
