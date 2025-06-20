import { NextRequest, NextResponse } from "next/server";

const CHECK_PATHS = [
  "/api/baskets/demo-basket-id/commits",
  "/api/baskets/demo-basket-id/blocks",
  "/api/baskets/demo-basket-id/change-queue?status=pending",
  "/api/agent-run",
];

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE;
  if (!baseUrl) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_API_BASE environment variable" },
      { status: 500 },
    );
  }

  const checks: { path: string; status: number | null; validJson: boolean }[] = [];

  for (const path of CHECK_PATHS) {
    let url: string;
    try {
      url = new URL(path, baseUrl).toString();
    } catch {
      checks.push({ path, status: null, validJson: false });
      continue;
    }

    try {
      const res = await fetch(url, { cache: "no-store" });
      let validJson = false;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        try {
          await res.clone().json();
          validJson = true;
        } catch {
          validJson = false;
        }
      }
      checks.push({ path, status: res.state, validJson });
    } catch {
      checks.push({ path, status: null, validJson: false });
    }
  }

  return NextResponse.json({ checks });
}
