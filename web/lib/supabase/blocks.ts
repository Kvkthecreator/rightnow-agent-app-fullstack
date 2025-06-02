import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// You can add types here later if you generate them
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseKey);
}

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
  const { data, error } = await (supabase
    .from("context_blocks") as ReturnType<typeof supabase["from"]>)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return { data, error };
}

// Create or update a context block (upsert)
export async function createBlock(block: BlockData) {
  const supabase = createClient();

  const { data, error } = await (supabase
    .from("context_blocks") as ReturnType<typeof supabase["from"]>)
    .upsert(block, { onConflict: "user_id" })
    .select()
    .single();

  return { data, error };
}
