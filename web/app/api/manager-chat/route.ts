import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { task_id, field, value } = body;
  const supabase = createClient();

  const { data, error } = await supabase
    .from("agent_sessions")
    .select("inputs, user_id, task_type_id")
    .eq("id", task_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const updated = { ...data.inputs, [field]: value };

  await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      task_id,
      user_id: data.user_id,
      task_type_id: data.task_type_id,
      prompt: value,
      collected_inputs: updated,
    }),
  });

  return NextResponse.json({ ok: true });
}