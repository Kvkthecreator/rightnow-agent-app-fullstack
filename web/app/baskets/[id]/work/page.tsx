"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import BasketWorkLayout from "@/components/layouts/BasketWorkLayout";

export default function BasketWorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderData, setRenderData] = useState<{
    basketName: string;
    status: string;
    scope: string[];
    dumpBody: string;
    empty: boolean;
  } | null>(null);

  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    params.then(({ id }) => {
      console.log("🧺 [BasketWorkPage] Basket ID param:", id);
      setId(id);
    });
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Authentication error. Please log in again.");
        return router.replace("/login");
      }

      const { data: workspace, error: wsError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (wsError || !workspace) {
        setError("Workspace not found.");
        return router.replace("/home");
      }

      const { data: basket, error: basketError } = await supabase
        .from("baskets")
        .select("id, name, status, tags")
        .eq("id", id)
        .eq("workspace_id", workspace.id)
        .single();

      console.log("📦 [BasketWorkPage] Fetched basket:", basket);

      if (basketError || !basket) {
        setError("Basket not found.");
        return;
      }

      const { data: firstDoc } = await supabase
        .from("documents")
        .select("id")
        .eq("basket_id", id)
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      const { data: anyDump } = await supabase
        .from("raw_dumps")
        .select("id")
        .eq("basket_id", id)
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let rawDumpBody = "";
      if (firstDoc?.id) {
        const { data: dump } = await supabase
          .from("raw_dumps")
          .select("body_md")
          .eq("document_id", firstDoc.id)
          .eq("workspace_id", workspace.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        rawDumpBody = dump?.body_md ?? "";
      }

      const { data: anyBlock } = await supabase
        .from("blocks")
        .select("id")
        .eq("basket_id", id)
        .eq("workspace_id", workspace.id)
        .limit(1)
        .maybeSingle();

      const isEmpty = !anyBlock && !firstDoc && !anyDump;

      setRenderData({
        basketName: basket.name ?? "Untitled",
        status: basket.status ?? "draft",
        scope: basket.tags ?? [],
        dumpBody: rawDumpBody,
        empty: isEmpty,
      });

      setLoading(false);
    };

    load();
  }, [id, supabase, router]);

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading workspace...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        ⚠️ <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!renderData) {
    return (
      <div className="p-4 text-yellow-500">
        ⚠️ Unexpected issue: renderData is null.
      </div>
    );
  }

  return (
    <BasketWorkLayout
      basketId={id!}
      basketName={renderData.basketName}
      status={renderData.status}
      scope={renderData.scope}
      dumpBody={renderData.dumpBody}
      empty={renderData.empty}
    />
  );
}
