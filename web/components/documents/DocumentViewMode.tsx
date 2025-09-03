"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, 
  Edit3, 
  Share2,
  Download,
  FileText,
  Calendar,
  Layers
} from 'lucide-react';
import type { 
  DocumentComposition, 
  SubstrateReferenceDTO, 
  SubstrateSummary 
} from '@shared/contracts/documents';

interface DocumentViewModeProps {
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

export function DocumentViewMode({ document, basketId }: DocumentViewModeProps) {
  const [composition, setComposition] = useState<DocumentComposition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchComposition = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/documents/${document.id}/composition`);
        if (!response.ok) {
          throw new Error('Failed to fetch document composition');
        }
        const data = await response.json();
        setComposition(data);
      } catch (err) {
        console.error('Error fetching composition:', err);
        setError(err instanceof Error ? err.message : 'Failed to load composition');
      } finally {
        setLoading(false);
      }
    };

    fetchComposition();
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

  const handleEdit = () => {
    router.push(`/baskets/${basketId}/documents/${document.id}/edit`);
  };

  const handleBack = () => {
    router.push(`/baskets/${basketId}/documents`);
  };

  const handleShare = () => {
    // TODO: Implement sharing functionality
    alert('Share functionality coming soon');
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Export functionality coming soon');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Document Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {document.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Created {formatDate(document.created_at)}</span>
                    </div>
                    {document.updated_at !== document.created_at && (
                      <span>Updated {formatDate(document.updated_at)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleShare}
                size="sm"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={handleEdit}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        
        {/* Composition Statistics */}
        {composition && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Document Composition</span>
            </div>
            <div className="grid grid-cols-5 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold text-blue-600">{composition.composition_stats.blocks_count}</div>
                <div className="text-gray-500">Blocks</div>
              </div>
              <div>
                <div className="font-semibold text-green-600">{composition.composition_stats.dumps_count}</div>
                <div className="text-gray-500">Dumps</div>
              </div>
              <div>
                <div className="font-semibold text-purple-600">{composition.composition_stats.context_items_count}</div>
                <div className="text-gray-500">Context</div>
              </div>
              <div>
                <div className="font-semibold text-orange-600">{composition.composition_stats.reflections_count}</div>
                <div className="text-gray-500">Reflections</div>
              </div>
              <div>
                <div className="font-semibold text-red-600">{composition.composition_stats.timeline_events_count}</div>
                <div className="text-gray-500">Timeline</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Document Content */}
        <div className="space-y-8">
          {composition ? (
            <>
              {/* Authored Prose Content */}
              {composition.document.content_raw ? (
                <div className="prose prose-lg max-w-none">
                  <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                    <div 
                      className="whitespace-pre-wrap text-gray-900 leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: composition.document.content_raw
                          .replace(/\n\n/g, '</p><p class="mt-6">')
                          .replace(/\n/g, '<br>')
                          .replace(/^/, '<p>')
                          .replace(/$/, '</p>')
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">No authored content yet</p>
                  <p className="text-sm mt-2">Add prose content in edit mode to create your narrative</p>
                </div>
              )}

              {/* Substrate References Section */}
              {composition.references.length > 0 && (
                <div className="border-t pt-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-blue-600" />
                    Referenced Substrate
                  </h2>
                  
                  <div className="grid gap-4">
                    {composition.references.map((ref, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`
                              inline-flex items-center px-2 py-1 rounded text-xs font-medium
                              ${ref.substrate.substrate_type === 'block' ? 'bg-blue-100 text-blue-800' : ''}
                              ${ref.substrate.substrate_type === 'dump' ? 'bg-green-100 text-green-800' : ''}
                              ${ref.substrate.substrate_type === 'context_item' ? 'bg-purple-100 text-purple-800' : ''}
                              ${ref.substrate.substrate_type === 'reflection' ? 'bg-orange-100 text-orange-800' : ''}
                              ${ref.substrate.substrate_type === 'timeline_event' ? 'bg-red-100 text-red-800' : ''}
                            `}>
                              {ref.substrate.substrate_type}
                            </div>
                            {ref.reference.role && (
                              <span className="text-xs text-gray-500 italic">
                                {ref.reference.role}
                              </span>
                            )}
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            {new Date(ref.substrate.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {ref.substrate.title && (
                          <h4 className="font-medium text-gray-900 mb-2">
                            {ref.substrate.title}
                          </h4>
                        )}
                        
                        <div className="text-sm text-gray-700 leading-relaxed">
                          {ref.substrate.preview}
                        </div>

                        {/* Specific snippets if any */}
                        {ref.reference.snippets && ref.reference.snippets.length > 0 && (
                          <div className="mt-3 border-l-2 border-gray-300 pl-3">
                            <div className="text-xs text-gray-500 mb-1">Referenced excerpts:</div>
                            {ref.reference.snippets.map((snippet, sidx) => (
                              <div key={sidx} className="text-sm text-gray-600 italic mb-1">
                                "{snippet}"
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Empty Document</h3>
              <p>This document has no content or substrate references yet.</p>
              <Button 
                onClick={handleEdit}
                className="mt-4"
              >
                Start Editing
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}