"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileText, Plus, Edit3, MoreVertical } from 'lucide-react';
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
      <EmptyState
        icon={<FileText className="h-12 w-12 text-gray-400" />}
        title="No documents yet"
        action={
          <p className="text-sm text-gray-500 mt-2">
            Click "New Document" to create your first document
          </p>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((document) => (
        <Card
          key={document.id}
          className="hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => handleDocumentClick(document)}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900">
                    {document.title}
                  </h3>
                </div>
                
                <div className="text-sm text-gray-500 mb-4">
                  Last updated {formatDate(document.updated_at)}
                </div>
                
                {document.metadata && Object.keys(document.metadata).length > 0 && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Metadata:</span>{' '}
                    {Object.entries(document.metadata).map(([key, value]) => (
                      <span key={key} className="inline-block mr-3">
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Add document actions menu
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}