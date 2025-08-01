import { DocumentsView } from "@/components/views/DocumentsView";
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

  return (
    <DocumentsView
      basketId={id}
      basketName={basketData.name}
      documentId="new" // Special case for document creation
    />
  );
}