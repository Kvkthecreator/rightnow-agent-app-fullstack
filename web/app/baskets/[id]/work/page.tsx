import { SubstrateCanvas } from "@/components/substrate/SubstrateCanvas";
import { YarnnnThinkingPartner } from "@/components/thinking/YarnnnThinkingPartner";
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
  const workspaceId = basketData.workspace?.id || 'default';

  return (
    <div className="min-h-screen">
      <div className="flex">
        {/* LEFT: Thinking Partner (Unified Substrate Input) */}
        <div className="w-1/3 border-r">
          <YarnnnThinkingPartner 
            basketId={id} 
            workspaceId={workspaceId}
            mode="substrate"
          />
        </div>
        
        {/* RIGHT: Substrate Canvas (Display Only) */}
        <div className="flex-1">
          <SubstrateCanvas basketId={id} workspaceId={workspaceId} />
        </div>
      </div>
    </div>
  );
}
