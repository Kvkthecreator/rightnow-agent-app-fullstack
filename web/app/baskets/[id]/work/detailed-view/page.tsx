import { DetailedViewContent } from "@/components/detailed-view/DetailedViewContent";
import { getBasketData } from "@/lib/data/basketData";
import { notFound } from "next/navigation";
import { DetailedViewPageLayout } from "@/components/layout/BasketPageLayout";

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
    <DetailedViewPageLayout basketId={id}>
      <DetailedViewContent
        basketId={id}
        basketName={basketData.name}
      />
    </DetailedViewPageLayout>
  );
}