import { SubstrateCanvas } from "@/components/substrate/SubstrateCanvas";
import { getBasketData } from "@/lib/data/basketData";
import { notFound } from "next/navigation";

interface NewDocumentPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewDocumentPage({ params }: NewDocumentPageProps) {
  const { id } = await params;
  const basketData = await getBasketData(id);
  
  if (!basketData) {
    notFound();
  }

  // Extract workspaceId from basketData
  const workspaceId = basketData.workspace_id || 'default';

  return (
    <div className="min-h-screen">
      {/* TRUE CONTEXT OS - Document composition through unified substrate system */}
      <SubstrateCanvas basketId={id} workspaceId={workspaceId} />
    </div>
  );
}