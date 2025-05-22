"use client";

import { useSession } from "@supabase/auth-helpers-react";

/** Returns { token, user } or { undefined, null } while loading */
export function useAuth() {
  const session = useSession();           // existing helper already in the repo
  return {
    token: session?.access_token,
    user: session?.user ?? null,
    isLoading: session === undefined,
  };
}