"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FileText, Clock, Layers, Sparkles } from 'lucide-react';
import type { DocumentDTO } from '@/shared/contracts/documents';

interface DocumentsListProps {
  basketId: string;
  limit?: number;
}

export function DocumentsList({ basketId, limit }: DocumentsListProps) {
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
        const docs: DocumentDTO[] = data.documents || [];
        const sorted = typeof limit === 'number' ? docs.slice(0, limit) : docs;
        setDocuments(sorted);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError(err instanceof Error ? err.message : 'Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [basketId]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
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
    const metadata = document.metadata || {};

    if (document.doc_type === 'starter_prompt') {
      const structured = metadata.structured_prompt as Record<string, any> | undefined;
      if (structured) {
        return [structured.opening, structured.context, structured.instructions]
          .filter(Boolean)
          .join(' ')
          .slice(0, 160);
      }
      return metadata.preview || 'Prompt pack ready to copy into ambient tools.';
    }

    const structured = metadata.structured_outline as Record<string, any> | undefined;
    if (structured?.summary) {
      return structured.summary.slice(0, 200);
    }

    if (metadata.description) {
      return metadata.description;
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

  const canonicalOrder = ['document_canon', 'starter_prompt'];
  const canonicalDocs = documents.filter(doc => canonicalOrder.includes(doc.doc_type));
  const otherDocs = documents.filter(doc => !canonicalOrder.includes(doc.doc_type));

  const renderCard = (document: DocumentDTO, isCanonical: boolean) => {
    const canonicalLabel = document.doc_type === 'document_canon'
      ? 'Context Brief'
      : document.doc_type === 'starter_prompt'
        ? 'Prompt Starter Pack'
        : 'Canon';

    return (
      <Card
        key={document.id}
        className={`p-4 hover:shadow-sm transition-shadow cursor-pointer border-gray-100 ${isCanonical ? 'border-purple-200 bg-purple-50/60' : ''}`}
        onClick={() => handleDocumentClick(document)}
      >
        <div className="flex items-start gap-3">
          <FileText className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isCanonical ? 'text-purple-500' : 'text-gray-400'}`} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900 text-base truncate">
                {document.title}
              </h3>
              {isCanonical && (
                <Badge variant="outline" className="border-purple-300 text-purple-700 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> {canonicalLabel}
                </Badge>
              )}
            </div>

            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {getContentPreview(document)}
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(document.latest_version_created_at || undefined)}
              </span>

              {document.metadata?.substrate_count && (
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {document.metadata.substrate_count} memory blocks
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-3">
      {canonicalDocs.map(doc => renderCard(doc, true))}
      {otherDocs.map(doc => renderCard(doc, false))}
    </div>
  );
}
