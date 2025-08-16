// web/app/api/baskets/new/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// NOTE: runtime validation lives in web/lib/schemas (not in shared/contracts)
import { CreateBasketReqSchema } from "@/lib/schemas/baskets"; // zod schema mirroring CreateBasketReq

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.yarnnn.com";

export async function POST(req: NextRequest) {
  // Canon: require a verified JWT (FastAPI enforces; we forward header)
  const token = (await cookies()).get("sb-access-token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Missing Authorization" } },
      { status: 401 }
    );
  }

  const auth = `Bearer ${token}`;

  // Validate request body against canon schema: { name?, idempotency_key }
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Malformed JSON" } },
      { status: 400 }
    );
  }

  const parsed = CreateBasketReqSchema.safeParse(payload);
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

  // Canon: workspace is bootstrapped server-side by FastAPI.
  // We forward only the allowed fields (no workspace_id).
  const forwardBody = JSON.stringify(parsed.data);

  const res = await fetch(`${API_BASE}/api/baskets/new`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: auth,
    },
    body: forwardBody,
  });

  // Pass through FastAPI response
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}
