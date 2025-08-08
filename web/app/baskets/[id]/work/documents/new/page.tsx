import { DocumentComposer } from "@/components/documents/DocumentComposer";
import { getBasketData } from "@/lib/data/basketData";
import { notFound, useRouter } from "next/navigation";
import { BasketPageLayout } from "@/components/layout/BasketPageLayout";

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
    <BasketPageLayout basketId={id} pageType="document">
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Create New Document
          </h1>
          <p className="text-gray-600 mb-6">
            Compose a document from your accepted blocks in <strong>{basketData.name}</strong>
          </p>
        </div>

        {/* Context OS Document Composer */}
        <DocumentComposer 
          basketId={id}
          onDocumentCreated={(documentId) => {
            // Navigate to the created document
            window.location.href = `/baskets/${id}/work/documents/${documentId}`;
          }}
        />
      </div>
    </BasketPageLayout>
  );
}