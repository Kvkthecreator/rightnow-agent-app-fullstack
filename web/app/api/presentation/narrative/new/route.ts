import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase/clients";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json().catch(() => ({}));
  const basketId = body?.basket_id;
  if (!basketId) return NextResponse.json({ error: "basket_id required" }, { status: 400 });

  const title = body?.title || `Narrative — ${new Date().toISOString().slice(0,10)}`;
  
  // For now, create a simple narrative without the full projection computation
  const body_content = `# ${title}

**Pattern:** Analyzing recent memory patterns...
**Tension:** Identifying areas of focus...
**Question:** What are the next steps?

(Generated from basket: ${basketId})
`;

  const { data, error } = await supabase.rpc('fn_document_create', {
    p_basket_id: basketId,
    p_title: title,
    p_content_raw: body_content,
    p_document_type: 'narrative',
    p_metadata: {}
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ docId: data, title });
}