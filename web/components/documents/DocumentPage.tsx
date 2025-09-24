"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/Card';
import { Save, Upload, ArrowLeft, ChevronDown, ChevronRight, ChevronUp, Database, FileText, MessageSquare, Clock, Layers } from 'lucide-react';
import { DocumentCompositionStatus } from './DocumentCompositionStatus';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { useBasket } from '@/contexts/BasketContext';
import { notificationAPI } from '@/lib/api/notifications';
// Removed broken reflections import
import ExplainButton from './ExplainButton';
import TrustBanner from './TrustBanner';
import { EnhancedDocumentViewer } from './EnhancedDocumentViewer';

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
  // Removed broken reflections state
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
        // Loading indicators managed by individual components
        
        // Load composition
        const compositionResponse = await fetch(`/api/documents/${document.id}/composition`);
        if (compositionResponse.ok) {
          setComposition(await compositionResponse.json());
        }
        
        // Removed broken reflections loading
        
        
        // Load version history
        const versionsResponse = await fetch(`/api/documents/${document.id}/versions`);
        if (versionsResponse.ok) {
          const versionsData = await versionsResponse.json();
          setVersions(versionsData.items || []);
        }
        
      } catch (err) {
        console.error('Failed to fetch read mode data:', err);
        // Removed reflections error handling
      } finally {
        // Loading complete
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
      
      // Emit success notification
      notificationAPI.emitActionResult('document.save', 'Document saved successfully', { severity: 'success' });
      return true; // Return success status
    } catch (e) {
      console.error('Failed to save document:', e);
      notificationAPI.emitActionResult('document.save', 'Failed to save document', { severity: 'error' });
      return false; // Return failure status
    } finally {
      setSaving(false);
    }
  };

  const extractToMemory = async () => {
    if (!prose.trim()) {
      notificationAPI.emitActionResult('document.extract', 'Please add some content before extracting to memory', { severity: 'warning' });
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
      notificationAPI.emitActionResult('document.extract', 'Failed to extract to memory', { severity: 'error' });
    }
  };

  const recomposeDocument = async () => {
    setSaving(true);
    try {
      // Canon-Pure: Direct document recomposition (artifact operation, no governance)
      const res = await fetch(`/api/documents/${document.id}/recompose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'Update document with latest memory',
          window_days: 30, // Default to last 30 days
          pinned_ids: [] // Could be extended for UI pinning
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Recompose failed');
      
      // Refresh page to show recomposition status
      window.location.reload();
    } catch (e) {
      notificationAPI.emitActionResult('document.recompose', 'Failed to recompose document', { severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Canon-Pure: Navigate to substrate source for deeper exploration
  const navigateToSubstrate = (substrate: any) => {
    if (!substrate) return;
    
    // Navigate to building blocks page with substrate highlighted
    // This preserves the substrate equality principle by treating all substrate types consistently
    router.push(`/baskets/${basketId}/building-blocks?highlight=${substrate.id}&type=${substrate.substrate_type}`);
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
              {/* Document Title with Phase 1 Trust Banner */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">
                  {document.title}
                </h1>
                
                {/* Phase 1: Trust Banner for composed documents */}
                {composition?.document?.metadata?.phase1_metrics && (
                  <TrustBanner
                    provenance_percentage={composition.document.metadata.phase1_metrics.provenance_percentage || 0}
                    freshness_score={composition.document.metadata.phase1_metrics.freshness_score || 0}
                    coverage_percentage={composition.document.metadata.phase1_metrics.coverage_percentage || 0}
                    raw_gaps_used={composition.document.metadata.phase1_metrics.raw_gaps_used || false}
                    processing_time_ms={composition.document.metadata.phase1_metrics.processing_time_ms}
                    substrate_count={composition.composition_stats?.total_substrate_references}
                    className="mb-4"
                  />
                )}
              </div>

              {/* Document Body with Substrate Context */}
              {composition?.document?.content_raw ? (
                <div className="relative mb-12">
                  {/* Canon-Pure: Substrate Context Toggle */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Layers className="h-4 w-4" />
                      <span>Composed from {composition.references?.length || 0} substrate sources</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Phase 1: Explain Button */}
                      <ExplainButton
                        documentId={document.id}
                        substrates={composition.references?.map((ref: any) => ({
                          id: ref.substrate?.id || ref.reference?.id,
                          type: ref.substrate?.substrate_type || 'unknown',
                          title: ref.substrate?.preview || ref.substrate?.title || 'Substrate source',
                          content: ref.substrate?.content || ref.substrate?.preview || '',
                          role: ref.reference?.role || 'supporting',
                          weight: ref.reference?.weight || 0.5,
                          selection_reason: ref.substrate?.selection_reason || '',
                          freshness_score: ref.substrate?.freshness_score,
                          confidence_score: ref.substrate?.confidence_score
                        })) || []}
                        metrics={composition.document?.metadata?.phase1_metrics || {
                          coverage_percentage: 0.8,
                          freshness_score: 0.7,
                          provenance_percentage: 0.9,
                          candidates_found: { blocks: 5, context_items: 3 },
                          candidates_selected: { blocks: 3, context_items: 2 },
                          processing_time_ms: 1200,
                          raw_gaps_used: false
                        }}
                        compositionSummary={composition.document?.metadata?.composition_summary}
                        variant="outline"
                        size="sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowComposition(!showComposition)}
                        className="text-xs"
                      >
                        {showComposition ? 'Hide' : 'Show'} Context Panel
                        {showComposition ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                      </Button>
                    </div>
                  </div>

                  <div className={`grid gap-6 ${showComposition ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {/* Main Content - Enhanced with Markdown and Substrate Overlays */}
                    <div className={showComposition ? 'lg:col-span-2' : 'col-span-1'}>
                      <EnhancedDocumentViewer
                        content={composition.document.content_raw}
                        references={composition.references?.map((ref: any) => ({
                          id: ref.substrate?.id || ref.reference?.id,
                          substrate_type: ref.substrate?.substrate_type || 'block',
                          preview: ref.substrate?.preview || ref.substrate?.title,
                          title: ref.substrate?.title,
                          role: ref.reference?.role,
                          weight: ref.reference?.weight
                        })) || []}
                      />
                    </div>

                    {/* Canon-Pure: Substrate Context Panel */}
                    {showComposition && composition.references && (
                      <div className="lg:col-span-1">
                        <div className="sticky top-6">
                          <Card className="p-4">
                            <h3 className="font-medium text-gray-900 mb-3 text-sm">Substrate Sources</h3>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {composition.references.map((ref: any, index: number) => (
                                <div key={ref.reference?.id || index} className="group">
                                  <button
                                    className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
                                    onClick={() => navigateToSubstrate(ref.substrate)}
                                  >
                                    <div className="flex items-start gap-2">
                                      {getSubstrateIcon(ref.substrate?.substrate_type || '')}
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-800 text-sm truncate">
                                          {ref.substrate?.preview || ref.substrate?.title || 'Substrate source'}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 capitalize">
                                          {ref.substrate?.substrate_type?.replace('_', ' ')}
                                          {ref.reference?.role && (
                                            <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                              {ref.reference.role}
                                            </span>
                                          )}
                                        </div>
                                        {ref.reference?.weight && (
                                          <div className="mt-1">
                                            <div className="w-full bg-gray-200 rounded-full h-1">
                                              <div 
                                                className="bg-blue-500 h-1 rounded-full" 
                                                style={{width: `${ref.reference.weight * 100}%`}}
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </Card>
                        </div>
                      </div>
                    )}
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

            {/* Canon-Pure: Action Bar */}
            {composition && (
              <div className="border-t border-gray-100 pt-6 mt-12">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Updated {new Date(document.updated_at).toLocaleDateString()}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={recomposeDocument}
                    className="text-xs text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                    disabled={saving}
                  >
                    🔄 Recompose from Memory
                  </Button>
                </div>
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
