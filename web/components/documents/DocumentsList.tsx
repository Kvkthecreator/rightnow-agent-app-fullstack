"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { FileText, Clock, Layers } from 'lucide-react';
import type { DocumentDTO } from '@/shared/contracts/documents';

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
    const diffHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return 'Today';
    if (diffHours < 48) return 'Yesterday';
    if (diffHours < 168) return `${Math.floor(diffHours / 24)} days ago`;
    return date.toLocaleDateString();
  };

  const getContentPreview = (document: DocumentDTO): string => {
    // Extract meaningful preview from document
    if (document.body_md) {
      // Strip markdown formatting for cleaner preview
      const plainText = document.body_md
        .replace(/#{1,6}\s/g, '')  // Remove headers
        .replace(/[*_~`]/g, '')     // Remove formatting
        .replace(/\n+/g, ' ')       // Replace newlines with spaces
        .trim();
      
      // Return first 150 chars
      return plainText.length > 150 
        ? plainText.substring(0, 150) + '...'
        : plainText;
    }
    
    // Fallback to metadata description if available
    if (document.metadata?.description) {
      return document.metadata.description;
    }
    
    return 'No preview available';
  };

  const handleDocumentClick = (document: DocumentDTO) => {
    router.push(`/baskets/${basketId}/documents/${document.id}`);
  };


  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-50 rounded-lg p-4">
            <div className="h-5 bg-gray-200 rounded mb-2 w-2/3"></div>
            <div className="h-3 bg-gray-100 rounded mb-2 w-full"></div>
            <div className="h-3 bg-gray-100 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600 text-sm">
        {error}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        No documents yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((document: any) => (
        <Card
          key={document.id}
          className="p-4 hover:shadow-sm transition-shadow cursor-pointer border-gray-100"
          onClick={() => handleDocumentClick(document)}
        >
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 text-base mb-1 truncate">
                {document.title}
              </h3>
              
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {getContentPreview(document)}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(document.updated_at)}
                </span>
                
                {document.metadata?.substrate_count && (
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {document.metadata.substrate_count} memory blocks
                  </span>
                )}
                
                {document.metadata?.original_filename && (
                  <span className="truncate max-w-[150px]">
                    {document.metadata.original_filename}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
