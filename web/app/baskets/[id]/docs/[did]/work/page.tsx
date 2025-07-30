import DocumentWorkPage from "@/components/document/DocumentWorkPage";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import { getBasketServer } from "@/lib/server/baskets";
import { getDocumentsServer } from "@/lib/server/documents";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string; did: string }>;
}

export default async function DocWorkPageRoute({ params }: PageProps) {
  const { id, did } = await params;
  
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/login?redirect=/baskets/${id}/docs/${did}/work`);
  }
  
  const workspace = await ensureWorkspaceServer(supabase);
  const workspaceId = workspace?.id;

  const basket = await getBasketServer(id, workspaceId ?? "");

  if (!basket) {
    redirect("/404");
  }

  const documents = await getDocumentsServer(workspaceId ?? "");

  return (
    <DocumentWorkPage
      basketId={id}
      documentId={did}
      basketName={basket.name}
      basketStatus={basket.status}
      basketScope={[]} // ✅ Temporarily empty until tags are wired properly
      documents={documents || []}
    />
  );
}
