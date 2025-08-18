import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BlocksPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServerComponentClient({ cookies });
  
  // Ensure user is authenticated and has workspace
  const workspace = await ensureWorkspaceServer(supabase);
  if (!workspace) {
    return <div>Not authorized</div>;
  }

  // Fetch blocks directly
  const { data: blocks } = await supabase
    .from("blocks")
    .select("*")
    .eq("basket_id", id)
    .order("created_at", { ascending: false });

  const items = blocks || [];
  
  return (
    <ul className="space-y-2">
      {items.map((block: any) => (
        <li key={block.id} className="rounded border p-2">
          {block.title || block.content || `Block ${block.id}`}
        </li>
      ))}
    </ul>
  );
}
