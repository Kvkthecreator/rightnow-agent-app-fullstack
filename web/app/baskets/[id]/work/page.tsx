import { ConsciousnessDashboard } from "@/components/dashboard/ConsciousnessDashboard";
import { BlockReview } from "@/components/blocks/BlockReview";
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

  return (
    <div className="space-y-6">
      {/* Context OS Block Review - Show proposed blocks first */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <BlockReview basketId={id} />
      </div>

      {/* Existing Consciousness Dashboard */}
      <ConsciousnessDashboard basketId={id} />
    </div>
  );
}
