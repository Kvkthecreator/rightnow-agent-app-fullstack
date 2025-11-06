"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  FileText,
  Search,
  Filter
} from "lucide-react";

// Import our document management hook
import { useDocuments } from "@/lib/substrate/useDocuments";

// Import document components
import { DocumentGrid } from "@/components/documents/DocumentGrid";

interface DocumentsViewProps {
  basketId: string;
  basketName: string;
  documentId?: string; // When viewing/editing specific document
}

export function DocumentsView({ basketId, basketName, documentId }: DocumentsViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { documents, isLoading } = useDocuments(basketId);

  // Find active document if documentId provided
  const activeDocument = documentId ? documents.find((doc: any) => doc.id === documentId) : null;

  // Canon v3.0: Document actions (no editing)
  const handleDocumentAction = (doc: any, action: string) => {
    console.log('Document action:', action, doc.id);
    // Actions like duplicate, share, export, archive would be implemented here
  };


  // Canon v3.0: No document editing - redirect to read-only document page
  if (documentId && activeDocument) {
    router.push(`/baskets/${basketId}/documents/${documentId}`);
    return null;
  }

  // Document creation removed per Canon v1.4.0 - documents are generated artifacts
  if (documentId === 'new') {
    router.push(`/baskets/${basketId}/documents`);
    return null;
  }

  // Default: DocumentDTO management view
  return (
    <div className="documents-view h-full flex flex-col bg-gray-50">
      {/* Documents Header */}
      <div className="documents-header bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-600">Substrate-composed documents for {basketName}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500">Documents are generated from structured ingredients</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Documents Content */}
      <div className="documents-content flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
              <p className="text-lg font-medium text-gray-900 mb-2">Loading your documents...</p>
              <p className="text-gray-600">Preparing your writing workspace</p>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <DocumentsEmptyState 
            basketName={basketName}
            onCreateDocument={() => {}}
          />
        ) : (
          <div className="p-6">
            <DocumentGrid
              documents={documents.filter((doc: any) =>
                (doc.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                ((doc as any).content || '').toLowerCase().includes(searchQuery.toLowerCase())
              )}
              onDocumentClick={(doc) => router.push(`/baskets/${basketId}/documents/${doc.id}`)}
              onDocumentAction={(doc, action) => handleDocumentAction(doc, action)}
            />
          </div>
        )}
      </div>

      {/* Document Creation Modal */}
    </div>
  );
}

// Empty state component
function DocumentsEmptyState({ basketName, onCreateDocument }: { basketName: string; onCreateDocument: () => void }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">No documents yet</p>
        <p className="text-gray-600">Documents in {basketName} will appear here</p>
        <p className="text-sm text-gray-500 mt-2">Documents are composed from substrate via P4 agents</p>
      </div>
    </div>
  );
}
