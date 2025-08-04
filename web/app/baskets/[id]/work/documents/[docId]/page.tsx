import { DocumentsView } from "@/components/views/DocumentsView";
import { getBasketData, getDocument } from "@/lib/data/basketData";
import { notFound } from "next/navigation";
import { DocumentPageLayout } from "@/components/layout/BasketPageLayout";

interface DocumentPageProps {
  params: Promise<{ id: string; docId: string }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id, docId } = await params;
  
  try {
    const [basketData, document] = await Promise.all([
      getBasketData(id),
      getDocument(id, docId)
    ]);
    
    if (!basketData) {
      notFound();
    }

    // Note: We don't check for document existence here because
    // DocumentsView handles the case where documentId exists but document doesn't
    // This allows for direct URL access to documents that may not be fully loaded yet

    return (
      <DocumentPageLayout basketId={id}>
        <DocumentsView
          basketId={id}
          basketName={basketData.name}
          documentId={docId}
        />
      </DocumentPageLayout>
    );
  } catch (error) {
    console.error('Error loading document page:', error);
    notFound();
  }
}