import { DocumentsView } from "@/components/views/DocumentsView";
import { getBasketData } from "@/lib/data/basketData";
import { notFound } from "next/navigation";

interface DocumentsPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentsPage({ params }: DocumentsPageProps) {
  const { id } = await params;
  const basketData = await getBasketData(id);
  
  if (!basketData) {
    notFound();
  }

  return (
    <DocumentsView
      basketId={id}
      basketName={basketData.name}
      // No documentId = shows documents management view
    />
  );
}