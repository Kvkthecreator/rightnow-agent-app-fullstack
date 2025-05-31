import { createClient } from "../supabaseClient";

export interface BlockData {
  id?: string;
  user_id: string;
  display_name: string;
  brand_or_company: string;
  sns_links?: {
    primary: string;
    handle: string;
    others: string[];
  };
  tone_preferences?: string;
  locale?: string;
  logo_url?: string;
}

// Fetch existing context block for a user
export async function getBlocks(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from<BlockData>("context_blocks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return { data, error };
}

// Create or update a context block (upsert)
export async function createBlock(
  block: BlockData
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from<BlockData>("context_blocks")
    .upsert(block, { onConflict: "user_id" })
    .select()
    .single();
  return { data, error };
}