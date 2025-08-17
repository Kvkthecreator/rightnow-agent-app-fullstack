import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ docId: string }>;
}

export async function GET(
  _req: NextRequest,
  ctx: RouteContext
) {
  const { docId } = await ctx.params;
  if (process.env.MOCK_BASKET_API) {
    return NextResponse.json({
      id: docId,
      title: "Marketing Plan",
      updated_at: new Date().toISOString(),
      content_rendered: "<p>Mock content</p>",
    });
  }
  return NextResponse.json({ error: "not found" }, { status: 404 });
}
