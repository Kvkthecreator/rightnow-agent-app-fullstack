import { computeReflections, type Note } from "@/lib/reflection";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import DashboardClient from "./DashboardClient";

async function fetchProjection(basketId: string) {
  const base =
    process.env.NEXT_PUBLIC_API_BASE ?? process.env.API_BASE ?? "";
  const res = await fetch(
    `${base}/api/baskets/${basketId}/projection?limit=200`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    },
  );
  if (!res.ok) return { entities: [], edges: [] };
  return res.json();
}

interface PageProps {
  params: Promise<{ id: string }>;
}

type DumpRow = {
  id: string;
  text_dump: string | null;
  created_at?: string | null;
};

export default async function DashboardPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServerComponentClient({ cookies });

  const workspace = await ensureWorkspaceServer(supabase);
  if (!workspace) {
    notFound();
  }

  const { data: basket } = await supabase
    .from("baskets")
    .select("id, name")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .single();

  if (!basket) {
    notFound();
  }

  const { data: dumps } = await supabase
    .from("raw_dumps")
    .select("id, text_dump, created_at")
    .eq("basket_id", id)
    .order("created_at", { ascending: true });
  const dumpRows = (dumps as DumpRow[] | null) || [];
  const notes: Note[] = dumpRows.map((d) => ({
    id: d.id,
    text: d.text_dump || "",
    created_at: d.created_at || undefined,
  }));

  const graph = await fetchProjection(id);
  const reflections = computeReflections(notes, graph);
  const fallback = reflections.pattern
    ? `You keep orbiting “${reflections.pattern}”.`
    : "Add a note to see what emerges.";

  return (
    <DashboardClient
      basketId={id}
      initialNotes={notes}
      pattern={reflections.pattern}
      tension={reflections.tension}
      question={reflections.question}
      fallback={fallback}
    />
  );
}
