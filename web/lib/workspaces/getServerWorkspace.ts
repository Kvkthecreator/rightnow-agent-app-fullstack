import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function getServerWorkspace(userId: string) {
  const supabase = createServerComponentClient({ cookies });

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", userId)
    .single();

  return workspace ?? null;
}
