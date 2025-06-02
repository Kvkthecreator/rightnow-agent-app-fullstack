// web/lib/briefs.ts

import { createClient } from "@/lib/supabaseClient";

export async function getBriefTypes() {
  const supabase = createClient();
  const { data, error } = await supabase.from("task_brief_types").select("*");

  if (error) {
    console.error("Error fetching brief types:", error);
    return [];
  }

  return data;
}

export async function getContextBlocks(user_id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("context_blocks")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching context blocks:", error);
    return [];
  }

  return data;
}

export async function createBrief(payload: {
  user_id: string;
  intent: string;
  sub_instructions?: string;
  media?: string[];
  context_block_id?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("task_briefs")
    .insert([{ ...payload }])
    .select()
    .single();

  if (error) {
    console.error("Error creating brief:", error);
    return { success: false, error };
  }

  return { success: true, data };
}
