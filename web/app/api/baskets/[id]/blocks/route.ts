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
          id: "blk1",
          title: "Target Audience",
          state: "accepted",
          updated_at: new Date().toISOString(),
        },
      ],
    });
  }
  return NextResponse.json({ items: [] });
}
