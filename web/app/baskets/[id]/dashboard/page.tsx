import { topPhrases, findTension, makeQuestion, type Note } from "@/lib/reflection";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import DashboardClient from "./DashboardClient";

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

  const notes: Note[] =
    (dumps as DumpRow[] | null)?.map((d) => ({
      id: d.id,
      text: d.text_dump || "",
      created_at: d.created_at || undefined,
    })) || [];

  const phrases = topPhrases(notes);
  const pattern = phrases[0]?.phrase;
  const tension = findTension(notes);
  const question = makeQuestion(pattern);
  const fallback = pattern ? `You keep orbiting “${pattern}”.` : "Add a note to see what emerges.";

  return (
    <DashboardClient
      basketId={id}
      initialNotes={notes}
      pattern={pattern}
      tension={tension}
      question={question}
      fallback={fallback}
    />
  );
}
