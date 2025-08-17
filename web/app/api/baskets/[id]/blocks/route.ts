import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
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
