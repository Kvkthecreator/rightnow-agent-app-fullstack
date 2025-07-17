"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const run = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.warn("❌ No user. Redirecting to /login.");
        router.replace("/login");
        return;
      }

      const { data: workspace, error: wsError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (wsError || !workspace) {
        console.warn("⚠️ No workspace. Redirecting to /baskets/new.");
        router.replace("/baskets/new");
        return;
      }

      const { data: basket } = await supabase
        .from("baskets")
        .select("id")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      const redirectTarget = basket?.id
        ? `/baskets/${basket.id}/work`
        : "/baskets/new";

      console.log("🧭 [HOME] Redirecting to:", redirectTarget);
      router.replace(redirectTarget);
    };

    run();
  }, []);

  return (
    <p className="p-4 text-muted-foreground">Preparing your workspace...</p>
  );
}
