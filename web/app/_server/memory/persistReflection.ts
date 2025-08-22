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
  const { data, error } = await supabase.rpc("fn_persist_reflection", {
    p_basket_id: basketId,
    p_pattern: pattern ?? null,
    p_tension: tension ?? null,
    p_question: question ?? null,
  });
  if (error) throw new Error(error.message);
  return data as string; // reflection_id
}