"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/Card';
import { Save, Upload, ArrowLeft, ChevronDown, ChevronRight, Database, FileText, MessageSquare, Clock, Layers } from 'lucide-react';
import { DocumentCompositionStatus } from './DocumentCompositionStatus';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { useBasket } from '@/contexts/BasketContext';
import type { GetReflectionsResponse, ReflectionDTO } from '@/shared/contracts/reflections';

type Mode = 'read' | 'edit';

interface DocumentRow {
  id: string;
  basket_id: string;
  title: string;
  content_raw?: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

interface DocumentPageProps {
  document: DocumentRow;
  basketId: string;
  initialMode?: Mode;
}

export function DocumentPage({ document, basketId, initialMode = 'read' }: DocumentPageProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [title, setTitle] = useState(document.title);
  const [prose, setProse] = useState(document.content_raw || '');
  const [saving, setSaving] = useState(false);
  const [composition, setComposition] = useState<any | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [compareTarget, setCompareTarget] = useState<string | null>(null);
  const [reflections, setReflections] = useState<ReflectionDTO[]>([]);
  const [reflectionsLoading, setReflectionsLoading] = useState(false);
  const [showComposition, setShowComposition] = useState(false);
  
  const { maturity } = useBasket();

  // Check for async composition status
  const workId = typeof window !== 'undefined' ? sessionStorage.getItem(`doc_${document.id}_work_id`) : null;
  const statusUrl = typeof window !== 'undefined' ? sessionStorage.getItem(`doc_${document.id}_status_url`) : null;
  const isAsyncComposition = document.metadata?.composition_status === 'pending' || document.metadata?.composition_status === 'processing';

  // Load all read mode data
  useEffect(() => {
    if (mode !== 'read') return;
    (async () => {
      try {
        setReflectionsLoading(true);
        
        // Load composition
        const compositionResponse = await fetch(`/api/documents/${document.id}/composition`);
        if (compositionResponse.ok) {
          setComposition(await compositionResponse.json());
        }
        
        // Load reflections
        const reflectionsUrl = new URL(`/api/baskets/${basketId}/reflections`, window.location.origin);
        reflectionsUrl.searchParams.set("limit", "5");
        
        const reflectionsResponse = await fetchWithToken(reflectionsUrl.toString());
        if (reflectionsResponse.ok) {
          const reflectionsData: GetReflectionsResponse = await reflectionsResponse.json();
          setReflections(reflectionsData.reflections);
        }
        
        
        // Load version history
        const versionsResponse = await fetch(`/api/documents/${document.id}/versions`);
        if (versionsResponse.ok) {
          const versionsData = await versionsResponse.json();
          setVersions(versionsData.items || []);
        }
        
      } catch (err) {
        console.error('Failed to fetch read mode data:', err);
        setReflections([]);
      } finally {
        setReflectionsLoading(false);
      }
    })();
  }, [basketId, mode, document.id]);

  const backToList = () => router.push(`/baskets/${basketId}/documents`);

  const saveDocument = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${document.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content_raw: prose })
      });
      if (!res.ok) throw new Error('Save failed');
      
      // Update local document state to reflect saved content
      document.title = title.trim();
      document.content_raw = prose;
      
      return true; // Return success status
    } catch (e) {
      console.error('Failed to save document:', e);
      alert('Failed to save document');
      return false; // Return failure status
    } finally {
      setSaving(false);
    }
  };

  const extractToMemory = async () => {
    if (!prose.trim()) {
      alert('Please add some content before extracting to memory');
      return;
    }

    try {
      // Save document first to ensure latest content is persisted
      await saveDocument();
      
      // Create memory dump with document context
      const dump_request_id = crypto.randomUUID();
      const res = await fetch('/api/dumps/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basket_id: basketId,
          dump_request_id,
          text_dump: `${title}\n\n${prose}`,
          meta: { 
            source: 'document_extract', 
            document_id: document.id,
            document_title: title,
            extraction_timestamp: new Date().toISOString()
          }
        })
      });
      
      if (!res.ok) throw new Error('Extract failed');
      
      // Redirect to memory page to see the processing
      router.push(`/baskets/${basketId}/memory`);
    } catch (e) {
      console.error('Failed to extract to memory:', e);
      alert('Failed to extract to memory');
    }
  };


  const formatReflectionAge = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      const diffMinutes = Math.round(diffHours * 60);
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${Math.round(diffHours)}h ago`;
    } else {
      const diffDays = Math.round(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  const getSubstrateIcon = (type: string) => {
    switch (type) {
      case 'block': return <Database className="h-4 w-4 text-blue-600" />;
      case 'dump': return <FileText className="h-4 w-4 text-green-600" />;
      case 'context_item': return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'timeline_event': return <Clock className="h-4 w-4 text-red-600" />;
      default: return <Database className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={backToList} className="p-2"><ArrowLeft className="h-4 w-4" /></Button>
            <div className="text-sm text-gray-500">Document</div>
            <div className="font-semibold text-gray-900">{document.title}</div>
          </div>
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList>
              <TabsTrigger value="read">📖 Read</TabsTrigger>
              <TabsTrigger value="edit">✏️ Edit</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Modes */}
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        {/* Read - Document as Artifact */}
        {mode === 'read' && (
          <div className="space-y-0">
            {/* Async Composition Status */}
            {isAsyncComposition && workId && (
              <div className="mb-6">
                <DocumentCompositionStatus
                  documentId={document.id}
                  workId={workId}
                  statusUrl={statusUrl || undefined}
                  onCompositionComplete={() => {
                    if (typeof window !== 'undefined') {
                      sessionStorage.removeItem(`doc_${document.id}_work_id`);
                      sessionStorage.removeItem(`doc_${document.id}_status_url`);
                    }
                    window.location.reload();
                  }}
                />
              </div>
            )}

            {/* Document Content - Primary Focus */}
            <div className="bg-white">
              {/* Document Title */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                  {document.title}
                </h1>
              </div>

              {/* Document Body */}
              {composition?.document?.content_raw ? (
                <div className="prose prose-gray prose-lg max-w-none mb-12">
                  <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {composition.document.content_raw}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-12 text-center mb-12">
                  <div className="text-gray-400 text-2xl mb-3">📝</div>
                  <div className="text-gray-600 mb-4">No content yet</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMode('edit')}
                  >
                    Start Writing
                  </Button>
                </div>
              )}
            </div>

            {/* Composition Context - Subtle Footer */}
            {composition && (
              <div className="border-t border-gray-100 pt-6 mt-12">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-6">
                    <span className="flex items-center gap-1">
                      <Layers className="h-4 w-4" />
                      Built from {composition.composition_stats.total_substrate_references || 0} memory sources
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Updated {new Date(document.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComposition(!showComposition)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showComposition ? 'Hide' : 'Show'} Composition
                    {showComposition ? 
                      <ChevronDown className="h-3 w-3 ml-1" /> :
                      <ChevronRight className="h-3 w-3 ml-1" />
                    }
                  </Button>
                </div>

                {/* Expandable Composition Details */}
                {showComposition && composition.references && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <div className="text-xs text-gray-600 mb-3">
                      This document is composed from these knowledge sources:
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {composition.references.slice(0, 8).map((ref: any, index: number) => (
                        <div key={ref.reference?.id || index} className="flex items-start gap-2 p-3 bg-gray-50 rounded text-xs">
                          {getSubstrateIcon(ref.substrate?.substrate_type || '')}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-700 truncate">
                              {ref.substrate?.preview || ref.substrate?.title || 'Memory source'}
                            </div>
                            <div className="text-gray-500 capitalize">
                              {ref.substrate?.substrate_type?.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {composition.references.length > 8 && (
                      <div className="text-center mt-3">
                        <span className="text-xs text-gray-500">
                          +{composition.references.length - 8} more sources
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Edit Mode - Clean Content Editor */}
        {mode === 'edit' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Document Editor */}
            <Card>
              <div className="p-8">
                <div className="space-y-6">
                  {/* Title Field */}
                  <div>
                    <label className="block text-lg font-medium text-gray-800 mb-3">
                      Title
                    </label>
                    <input 
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Document title..."
                    />
                  </div>
                  
                  {/* Content Field */}
                  <div>
                    <label className="block text-lg font-medium text-gray-800 mb-3">
                      Content
                    </label>
                    <textarea 
                      className="w-full min-h-[400px] px-4 py-4 border border-gray-200 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 leading-relaxed" 
                      value={prose} 
                      onChange={(e) => setProse(e.target.value)}
                      placeholder="Write your content here..."
                      style={{ fontFamily: 'ui-serif, Georgia, serif' }}
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <div className="flex gap-3">
                      <Button 
                        onClick={saveDocument} 
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 px-6"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={extractToMemory}
                        disabled={!prose.trim()}
                        className="border-green-200 text-green-700 hover:bg-green-50 px-6"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Extract to Memory
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      onClick={() => setMode('read')}
                      className="text-gray-500"
                    >
                      Done Editing
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div>
      <div className={`font-semibold ${color || ''}`}>{String(value)}</div>
      <div className="text-gray-500">{label}</div>
    </div>
  );
}


function VersionContent({ documentId, versionHash }: { documentId: string; versionHash: string }) {
  const [content, setContent] = useState<string>('');
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/documents/${documentId}/versions?version_hash=${encodeURIComponent(versionHash)}`);
      if (res.ok) {
        const data = await res.json();
        const item = (data.items || []).find((i: any) => i.version_hash === versionHash);
        setContent(item?.content || '(empty)');
      }
    })();
  }, [documentId, versionHash]);
  return <pre className="text-xs whitespace-pre-wrap">{content}</pre>;
}
