import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  // For now, return empty projection data
  // This will be implemented with actual graph projection logic later
  return NextResponse.json({
    entities: [],
    edges: []
  });
}