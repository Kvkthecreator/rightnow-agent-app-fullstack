import { RefactoredDocumentView } from "@/components/documents/RefactoredDocumentView";
import { getBasketData } from "@/lib/data/basketData";
import { notFound } from "next/navigation";

interface DocumentPageProps {
  params: Promise<{ id: string; docId: string }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id, docId } = await params;
  
  try {
    const basketData = await getBasketData(id);
    
    if (!basketData) {
      notFound();
    }

    // The RefactoredDocumentView handles document loading internally
    // This provides a cleaner architecture with unified editing experience

    return (
      <RefactoredDocumentView
        basketId={id}
        basketName={basketData.name}
        documentId={docId}
      />
    );
  } catch (error) {
    console.error('Error loading document page:', error);
    notFound();
  }
}