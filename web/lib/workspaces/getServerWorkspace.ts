import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/lib/dbTypes"; // optional, only if using typed Supabase

export async function getServerWorkspace() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: existingWorkspace, error: fetchError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existingWorkspace) {
    const { data: newWorkspace, error: insertError } = await supabase
      .from("workspaces")
      .insert({
        user_id: user.id,
        name: "My Workspace",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to auto-create workspace:", insertError.message);
      return null;
    }

    return newWorkspace;
  }

  return existingWorkspace;
}
