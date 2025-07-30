"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StandardizedBasketLayout from "@/components/basket/StandardizedBasketLayout";
import DocumentEditor from "@/components/document/DocumentEditor";
import type { Document } from "@/types";

interface DocumentWorkPageProps {
  basketId: string;
  documentId: string;
  basketName: string;
  basketStatus: string;
  basketScope: string[];
  documents: Document[];
}

export default function DocumentWorkPage({
  basketId,
  documentId,
  basketName,
  basketStatus,
  basketScope,
  documents
}: DocumentWorkPageProps) {
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  // Find the current document
  useEffect(() => {
    const currentDoc = documents.find(doc => doc.id === documentId);
    setDocument(currentDoc || null);
    setLoading(false);
  }, [documents, documentId]);

  // Handle document loading error
  if (!loading && !document) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Document not found</h2>
          <p className="text-muted-foreground mb-4">
            The document you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => router.push(`/baskets/${basketId}/work`)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90"
          >
            Back to Basket
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const mainContent = (
    <DocumentEditor
      basketId={basketId}
      document={document!}
      onDocumentUpdate={(updatedDoc) => setDocument(updatedDoc)}
    />
  );

  return (
    <StandardizedBasketLayout
      basketId={basketId}
      basketName={basketName}
      status={basketStatus}
      scope={basketScope}
      documents={documents}
      mainContent={mainContent}
      contextType="document"
      intelligenceMode="active"
      currentDocumentId={documentId}
      showIntelligenceHints={true}
      onIntelligenceDiscovered={() => console.log("User discovered intelligence features in document context")}
    />
  );
}