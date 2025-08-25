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
  Hash,
  Database,
  FolderOpen,
  Lightbulb,
  Clock,
  Filter,
  Layers
} from 'lucide-react';
import type { 
  DocumentComposition, 
  SubstrateReferenceDTO, 
  SubstrateSummary,
  SubstrateType 
} from '@shared/contracts/documents';

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

interface SubstrateReferenceWithSummary {
  reference: SubstrateReferenceDTO;
  substrate: SubstrateSummary;
}

export function DocumentCompositionView({ document, basketId }: DocumentCompositionViewProps) {
  const [composition, setComposition] = useState<DocumentComposition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(document.title);
  const [filterType, setFilterType] = useState<SubstrateType | 'all'>('all');
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

  const getFilteredReferences = () => {
    if (!composition) return [];
    if (filterType === 'all') return composition.references;
    return composition.references.filter(ref => ref.reference.substrate_type === filterType);
  };

  const handleDetachReference = async (referenceId: string, substrateType: SubstrateType, substrateId: string) => {
    try {
      const response = await fetch(
        `/api/documents/${document.id}/references?substrate_type=${substrateType}&substrate_id=${substrateId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to detach reference');
      }

      // Refresh composition
      setComposition(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          references: prev.references.filter(ref => ref.reference.id !== referenceId),
          composition_stats: {
            ...prev.composition_stats,
            [`${substrateType}s_count`]: Math.max(0, prev.composition_stats[`${substrateType}s_count` as keyof typeof prev.composition_stats] as number - 1),
            total_references: prev.references.length - 1
          }
        };
      });
    } catch (err) {
      console.error('Error detaching reference:', err);
    }
  };

  const getSubstrateIcon = (type: SubstrateType) => {
    switch (type) {
      case 'block': return <FileText className="h-4 w-4" />;
      case 'dump': return <Database className="h-4 w-4" />;
      case 'context_item': return <FolderOpen className="h-4 w-4" />;
      case 'reflection': return <Lightbulb className="h-4 w-4" />;
      case 'timeline_event': return <Clock className="h-4 w-4" />;
    }
  };

  const getSubstrateColor = (type: SubstrateType) => {
    switch (type) {
      case 'block': return 'text-blue-600 bg-blue-50';
      case 'dump': return 'text-green-600 bg-green-50';
      case 'context_item': return 'text-purple-600 bg-purple-50';
      case 'reflection': return 'text-orange-600 bg-orange-50';
      case 'timeline_event': return 'text-red-600 bg-red-50';
    }
  };

  const SubstrateReferenceCard = ({ 
    reference, 
    substrate, 
    onDetach 
  }: { 
    reference: SubstrateReferenceDTO; 
    substrate: SubstrateSummary; 
    onDetach: (id: string, type: SubstrateType, substrateId: string) => void;
  }) => (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getSubstrateColor(substrate.substrate_type)}`}>
              {getSubstrateIcon(substrate.substrate_type)}
              {substrate.substrate_type.replace('_', ' ')}
            </span>
            {reference.role && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {reference.role}
              </span>
            )}
            {reference.weight && (
              <span className="text-xs text-gray-500">
                Weight: {(reference.weight * 100).toFixed(0)}%
              </span>
            )}
          </div>
          
          {substrate.title && (
            <h4 className="font-medium text-gray-900 mb-1">
              {substrate.title}
            </h4>
          )}
          
          <p className="text-sm text-gray-600 mb-2">
            {substrate.preview}
          </p>
          
          {reference.snippets.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-gray-500 mb-1">Snippets:</p>
              <div className="space-y-1">
                {reference.snippets.map((snippet, idx) => (
                  <p key={idx} className="text-sm text-gray-700 bg-gray-100 p-2 rounded italic">
                    "{snippet}"
                  </p>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 flex items-center gap-4">
            <span>Added {formatDate(reference.created_at)}</span>
            {substrate.substrate_type === 'block' && substrate.state && (
              <span>State: {substrate.state}</span>
            )}
            {substrate.substrate_type === 'dump' && substrate.char_count && (
              <span>{substrate.char_count.toLocaleString()} chars</span>
            )}
            {substrate.substrate_type === 'context_item' && substrate.context_type && (
              <span>Type: {substrate.context_type}</span>
            )}
            {substrate.substrate_type === 'reflection' && substrate.reflection_type && (
              <span>Type: {substrate.reflection_type}</span>
            )}
            {substrate.substrate_type === 'timeline_event' && substrate.event_kind && (
              <span>Event: {substrate.event_kind}</span>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDetach(reference.id, reference.substrate_type, reference.substrate_id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-4"
        >
          <Unlink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

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

        {/* Composition Stats */}
        {composition && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Composition Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {composition.composition_stats.blocks_count}
                  </div>
                  <div className="text-sm text-gray-500">Blocks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {composition.composition_stats.dumps_count}
                  </div>
                  <div className="text-sm text-gray-500">Dumps</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {composition.composition_stats.context_items_count}
                  </div>
                  <div className="text-sm text-gray-500">Context Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {composition.composition_stats.reflections_count}
                  </div>
                  <div className="text-sm text-gray-500">Reflections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {composition.composition_stats.timeline_events_count}
                  </div>
                  <div className="text-sm text-gray-500">Timeline Events</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Substrate References Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Substrate References ({composition?.references.length || 0})
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value as SubstrateType | 'all')}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="all">All Types</option>
                    <option value="block">Blocks</option>
                    <option value="dump">Dumps</option>
                    <option value="context_item">Context Items</option>
                    <option value="reflection">Reflections</option>
                    <option value="timeline_event">Timeline Events</option>
                  </select>
                </div>
                <Button size="sm" disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reference
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
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
            ) : !composition || composition.references.length === 0 ? (
              <EmptyState
                icon={<Link className="h-8 w-8 text-gray-400" />}
                title="No substrate references yet"
                action={
                  <p className="text-sm text-gray-500 mt-2">
                    Attach blocks, dumps, context items, reflections, or timeline events to compose this document
                  </p>
                }
              />
            ) : (
              <div className="space-y-4">
                {getFilteredReferences().map((item) => (
                  <SubstrateReferenceCard
                    key={item.reference.id}
                    reference={item.reference}
                    substrate={item.substrate}
                    onDetach={handleDetachReference}
                  />
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