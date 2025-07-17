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
        router.replace("/login");
        return;
      }

      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!workspace) {
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

      if (!basket) {
        router.replace("/baskets/new");
      } else {
        router.replace(`/baskets/${basket.id}/work`);
      }
    };

    run();
  }, []);

  return <p className="p-4 text-muted-foreground">Redirecting...</p>;
}
