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
          delta_id: "delta1",
          kind: "doc_update",
          target: { type: "document", id: "doc1", title: "Marketing Plan" },
          summary: "Add outreach section",
          preview_before: "...",
          preview_after: "...",
        },
      ],
    });
  }
  return NextResponse.json({ items: [] });
}
