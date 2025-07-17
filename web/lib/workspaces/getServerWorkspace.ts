import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

export async function getServerWorkspace(userId: string) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return workspace;
}
