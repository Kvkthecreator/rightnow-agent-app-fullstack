import { SubstrateManager } from "@/components/substrate/SubstrateManager";
import { RealtimeDebug } from "@/components/debug/RealtimeDebug";
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
    <>
      <SubstrateManager basketId={id} />
      <RealtimeDebug />
    </>
  );
}
