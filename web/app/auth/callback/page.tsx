"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setError("Authentication failed. Please try logging in again.");
        setTimeout(() => router.replace("/login"), 1500);
        return;
      }

      const user = session.user;

      // 🧠 Optional: create workspace if not exists
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let workspaceId = workspace?.id;
      if (!workspaceId) {
        const { data: newWorkspace, error: createError } = await supabase
          .from("workspaces")
          .insert({ user_id: user.id })
          .select("id")
          .single();

        if (createError || !newWorkspace?.id) {
          setError("Unable to initialize workspace.");
          return;
        }

        workspaceId = newWorkspace.id;
      }

      const storedPath =
        typeof window !== "undefined"
          ? localStorage.getItem("postLoginPath")
          : null;

      if (storedPath) {
        localStorage.removeItem("postLoginPath");
        router.replace(storedPath);
        return;
      }

      const { data: baskets } = await supabase
        .from("baskets")
        .select("id")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (baskets && baskets.length > 0) {
        router.replace(`/baskets/${baskets[0].id}/work?tab=dashboard`);
      } else {
        const { data: newBasket, error: insertError } = await supabase
          .from("baskets")
          .insert({ name: "Untitled Basket", workspace_id: workspaceId })
          .select("id")
          .single();

        if (insertError || !newBasket?.id) {
          setError("Could not create your first basket.");
          return;
        }

        router.replace(`/baskets/${newBasket.id}/work?tab=dashboard`);
      }
    };

    checkSession();
  }, [router, supabase]);

  if (error) return <p>{error}</p>;
  return <p>Loading...</p>;
}
