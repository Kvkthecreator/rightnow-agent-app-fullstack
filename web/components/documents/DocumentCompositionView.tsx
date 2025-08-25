"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { 
  FileText, 
  ArrowLeft, 
  Edit3, 
  Plus,
  Link,
  Unlink,
  Calendar,
  Hash
} from 'lucide-react';
import type { DocumentDTO, BlockLinkDTO } from '@shared/contracts/documents';

interface DocumentCompositionViewProps {
  document: {
    id: string;
    basket_id: string;
    title: string;
    created_at: string;
    updated_at: string;
    metadata: Record<string, any>;
  };
  basketId: string;
}

interface BlockReference {
  id: string;
  block_id: string;
  title: string;
  preview: string;
  occurrences: number;
  snippets: string[];
  created_at: string;
}

export function DocumentCompositionView({ document, basketId }: DocumentCompositionViewProps) {
  const [blockLinks, setBlockLinks] = useState<BlockReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(document.title);
  const router = useRouter();

  useEffect(() => {
    const fetchBlockLinks = async () => {
      try {
        setLoading(true);
        // For now, we'll show empty state since block links fetching requires additional queries
        // In a full implementation, this would fetch from block_links table with block details
        setBlockLinks([]);
      } catch (err) {
        console.error('Error fetching block links:', err);
        setError(err instanceof Error ? err.message : 'Failed to load block links');
      } finally {
        setLoading(false);
      }
    };

    fetchBlockLinks();
  }, [document.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTitleUpdate = async () => {
    if (newTitle.trim() === document.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update document title');
      }

      setIsEditingTitle(false);
      // Refresh the page to show updated title
      router.refresh();
    } catch (err) {
      console.error('Error updating title:', err);
      setNewTitle(document.title); // Reset on error
      setIsEditingTitle(false);
    }
  };

  const handleBack = () => {
    router.push(`/baskets/${basketId}/documents`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 space-y-6 max-w-4xl px-4">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-2xl font-semibold bg-transparent border-b-2 border-blue-500 outline-none flex-1"
                  onBlur={handleTitleUpdate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleUpdate();
                    if (e.key === 'Escape') {
                      setNewTitle(document.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-semibold text-gray-900">
                  {document.title}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingTitle(true)}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flex items-center gap-6 text-sm text-gray-600 mt-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDate(document.created_at)}</span>
              </div>
              {document.updated_at !== document.created_at && (
                <div className="flex items-center gap-2">
                  <span>Updated {formatDate(document.updated_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Document Metadata */}
        {document.metadata && Object.keys(document.metadata).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Document Metadata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(document.metadata).map(([key, value]) => (
                  <div key={key} className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-gray-900">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Block References Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Block References
              </CardTitle>
              <Button size="sm" disabled>
                <Plus className="h-4 w-4 mr-2" />
                Link Block
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-3 bg-gray-100 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : blockLinks.length === 0 ? (
              <EmptyState
                icon={<Link className="h-8 w-8 text-gray-400" />}
                title="No blocks linked yet"
                action={
                  <p className="text-sm text-gray-500 mt-2">
                    Link blocks to create references in this document
                  </p>
                }
              />
            ) : (
              <div className="space-y-4">
                {blockLinks.map((blockRef) => (
                  <div
                    key={blockRef.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {blockRef.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {blockRef.preview}
                        </p>
                        <div className="text-xs text-gray-500">
                          {blockRef.occurrences} occurrence(s) • 
                          Linked {formatDate(blockRef.created_at)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Composition Surface Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Composition Surface
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Document composition surface</p>
              <p className="text-sm text-gray-500">
                This will display linked block references and allow composition without substrate edits
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}