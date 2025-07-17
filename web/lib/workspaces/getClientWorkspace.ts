"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getServerWorkspace } from "./getServerWorkspace";
import { Database } from "@/types/supabase";

export async function getClientWorkspace() {
  const supabase = createClientComponentClient<Database>();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  return getServerWorkspace(user.id);
}
