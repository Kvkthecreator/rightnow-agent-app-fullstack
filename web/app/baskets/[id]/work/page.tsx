import { SubstrateCanvas } from "@/components/substrate/SubstrateCanvas";
import { getBasketData } from "@/lib/data/basketData";
import { notFound } from "next/navigation";

interface DashboardPageProps {
  params: Promise<{ id: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { id } = await params;
  const basketData = await getBasketData(id);
  
  if (!basketData) {
    notFound();
  }

  // Extract workspaceId from basketData
  const workspaceId = basketData.workspace_id || 'default';

  return (
    <div className="min-h-screen">
      {/* TRUE CONTEXT OS - The ONLY interface */}
      <SubstrateCanvas basketId={id} workspaceId={workspaceId} />
    </div>
  );
}
