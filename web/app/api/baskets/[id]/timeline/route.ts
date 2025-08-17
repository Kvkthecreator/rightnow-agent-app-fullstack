import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _req: NextRequest,
  ctx: RouteContext
) {
  const { id } = await ctx.params;
  if (process.env.MOCK_BASKET_API) {
    return NextResponse.json({
      items: [
        {
          ts: new Date().toISOString(),
          type: "delta",
          summary: "Accepted update to Marketing Plan",
        },
        {
          ts: new Date().toISOString(),
          type: "event",
          summary: "Dump added from Figma notes",
        },
      ],
    });
  }
  return NextResponse.json({ items: [] });
}
