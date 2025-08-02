import { DetailedViewDashboard } from "@/components/detailed-view/DetailedViewDashboard";
import { getBasketData } from "@/lib/data/basketData";
import { notFound } from "next/navigation";

interface DetailedViewPageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailedViewPage({ params }: DetailedViewPageProps) {
  const { id } = await params;
  const basketData = await getBasketData(id);
  
  if (!basketData) {
    notFound();
  }

  return (
    <DetailedViewDashboard
      basketId={id}
      basketName={basketData.name}
    />
  );
}