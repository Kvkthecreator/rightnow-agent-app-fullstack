"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export async function getClientWorkspace() {
  const supabase = createClientComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return workspace ?? null;
}
