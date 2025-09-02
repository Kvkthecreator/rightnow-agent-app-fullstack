"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileText, Sparkles, Eye, Clock } from 'lucide-react';
import type { DocumentDTO } from '@shared/contracts/documents';

interface DocumentsListProps {
  basketId: string;
}

export function DocumentsList({ basketId }: DocumentsListProps) {
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/baskets/${basketId}/documents`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        
        const data = await response.json();
        setDocuments(data.documents || []);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError(err instanceof Error ? err.message : 'Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [basketId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleDocumentClick = (document: DocumentDTO) => {
    router.push(`/baskets/${basketId}/documents/${document.id}`);
  };

  const handleProposeBreakdown = async (document: DocumentDTO, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch('/api/changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_point: 'document_edit',
          basket_id: basketId,
          ops: [{
            type: 'BreakdownDocument',
            data: {
              document_id: document.id,
              breakdown_reason: 'User requested document breakdown into substrate'
            }
          }]
        })
      });

      const result = await response.json();
      
      if (result.route === 'direct') {
        toast.success('Document breakdown started ✓');
      } else {
        toast.success('Document breakdown proposed for review ⏳');
      }
      
    } catch (error) {
      console.error('Breakdown proposal error:', error);
      toast.error('Failed to propose breakdown');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-5 bg-gray-200 rounded mb-3 w-3/4"></div>
              <div className="h-4 bg-gray-100 rounded mb-2 w-full"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="border-2 border-dashed border-gray-200">
        <CardContent className="p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-600 text-sm mb-6">
            Upload your first document to start building your knowledge library
          </p>
          <div className="text-xs text-gray-500">
            Supported: PDF, TXT, MD, DOCX, images
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((document: any) => (
        <Card
          key={document.id}
          className="hover:shadow-md transition-shadow group border-blue-100"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => handleDocumentClick(document)}>
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {document.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Updated {formatDate(document.updated_at)}</span>
                    </div>
                  </div>
                </div>
                
                {document.metadata && (
                  <div className="text-xs text-gray-600 mb-3">
                    {document.metadata.original_filename && (
                      <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2">
                        {document.metadata.original_filename}
                      </span>
                    )}
                    {document.metadata.file_size && (
                      <span className="text-gray-500">
                        {(document.metadata.file_size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDocumentClick(document)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleProposeBreakdown(document, e)}
                  className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Sparkles className="h-4 w-4" />
                  Propose Breakdown
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}