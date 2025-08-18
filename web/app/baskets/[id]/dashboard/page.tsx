// Testing with Card component only
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServerComponentClient({ cookies });
  
  // Ensure user is authenticated and has workspace
  const workspace = await ensureWorkspaceServer(supabase);
  if (!workspace) {
    notFound();
  }

  // Fetch basket data directly using Supabase client
  const { data: basket, error } = await supabase
    .from("baskets")
    .select("id, name, updated_at")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .single();

  if (error || !basket) {
    notFound();
  }

  // Fetch documents
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("basket_id", id)
    .limit(3);

  // For now, mock the state and proposals until we have the actual data structures
  const state = {
    basket_id: basket.id,
    name: basket.name,
    counts: { documents: documents?.length || 0, blocks: 0, context_items: 0 },
    last_updated: basket.updated_at,
    current_focus: "",
  };

  const docs = { items: documents || [] };
  const proposals = { items: [] }; // Mock for now

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{basket.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mt-2">
            Last updated: {new Date(basket.updated_at).toLocaleString()}
          </p>
          <p className="mt-4">Documents: {documents?.length || 0}</p>
          <p className="mt-2 text-gray-700">Testing Card component only!</p>
        </CardContent>
      </Card>
    </div>
  );
}
