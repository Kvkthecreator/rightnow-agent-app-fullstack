import { createServerSupabaseClient } from "@/lib/supabase/server";

type PersistArgs = {
  basketId: string;
  pattern?: string | null;
  tension?: string | null;
  question?: string | null;
};

export async function persistReflection({
  basketId,
  pattern,
  tension,
  question,
}: PersistArgs) {
  const supabase = createServerSupabaseClient();
  
  // Build reflection text from pattern/tension/question
  const reflectionParts = [
    pattern ? `Pattern: ${pattern}` : null,
    tension ? `Tension: ${tension}` : null,
    question ? `Question: ${question}` : null
  ].filter(Boolean);
  
  const reflection_text = reflectionParts.join('\n\n');
  if (!reflection_text) return null;
  
  // Use new substrate reflection function
  const { data, error } = await supabase.rpc("fn_reflection_create_from_substrate", {
    p_basket_id: basketId,
    p_reflection_text: reflection_text,
  });
  
  if (error) throw new Error(error.message);
  return data as string; // reflection_id
}