import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";

type PersistArgs = {
  basket_id: string;
  pattern: string | null;
  tension: string | null;
  question: string | null;
  computed_at?: string; // optional override
};

export async function persistReflection(args: PersistArgs) {
  const supabase = createServerComponentClient({ cookies });
  const computed_at = args.computed_at ?? new Date().toISOString();

  // 1) Insert durable reflection
  const { data: reflection, error: rErr } = await supabase
    .from("basket_reflections")
    .insert({
      basket_id: args.basket_id,
      pattern: args.pattern,
      tension: args.tension,
      question: args.question,
      computed_at,
    })
    .select()
    .single();
  if (rErr) throw rErr;

  // 2) Append to history
  const preview = args.pattern ?? args.question ?? "Reflection updated";
  const { error: hErr } = await supabase.from("basket_history").insert({
    basket_id: args.basket_id,
    ts: computed_at,
    kind: "reflection",
    ref_id: reflection.id,
    preview,
    payload: {
      pattern: args.pattern,
      tension: args.tension,
      question: args.question,
      computed_at,
    },
  });
  if (hErr) throw hErr;

  // 3) Emit canonical event
  await supabase.from("events").insert({
    basket_id: args.basket_id,
    kind: "reflection.computed",
    ts: computed_at,
    payload: {
      pattern: args.pattern,
      tension: args.tension,
      question: args.question,
    },
  });

  return reflection;
}