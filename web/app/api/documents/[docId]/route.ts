import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { docId: string } }
) {
  if (process.env.MOCK_BASKET_API) {
    return NextResponse.json({
      id: params.docId,
      title: "Marketing Plan",
      updated_at: new Date().toISOString(),
      content_rendered: "<p>Mock content</p>",
    });
  }
  return NextResponse.json({ error: "not found" }, { status: 404 });
}
