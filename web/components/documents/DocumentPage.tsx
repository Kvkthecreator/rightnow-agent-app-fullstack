"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/Card';
import { Layers, Save, Upload, GitCompare, Activity, ArrowLeft, Brain, ChevronDown, ChevronRight, Database, FileText, MessageSquare, Clock, History, Target, TrendingUp } from 'lucide-react';
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
  const [showSubstrateDetails, setShowSubstrateDetails] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  
  // Get basket maturity for adaptive edit guidance
  const { maturity, maturityGuidance } = useBasket();

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
        {/* Read */}
        {mode === 'read' && (
          <div className="space-y-6">
            {/* Document Dashboard */}
            {composition && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Layers className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Document Overview</h2>
                  </div>
                  <div className="text-xs text-gray-500">
                    Last updated {new Date(document.updated_at).toLocaleDateString()}
                  </div>
                </div>
                
                {/* Substrate Composition Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <button
                    onClick={() => setShowSubstrateDetails(true)}
                    className="bg-white rounded-lg p-4 text-center border border-blue-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200 group"
                  >
                    <div className="text-2xl font-bold text-blue-600 mb-1 group-hover:text-blue-700">{composition.composition_stats.blocks_count}</div>
                    <div className="text-sm text-gray-600 group-hover:text-gray-700">Knowledge Blocks</div>
                    <div className="text-xs text-gray-500 mt-1">Structured insights</div>
                  </button>
                  <button
                    onClick={() => setShowSubstrateDetails(true)}
                    className="bg-white rounded-lg p-4 text-center border border-green-100 hover:border-green-200 hover:bg-green-50/50 transition-all duration-200 group"
                  >
                    <div className="text-2xl font-bold text-green-600 mb-1 group-hover:text-green-700">{composition.composition_stats.dumps_count}</div>
                    <div className="text-sm text-gray-600 group-hover:text-gray-700">Raw Content</div>
                    <div className="text-xs text-gray-500 mt-1">Unprocessed material</div>
                  </button>
                  <button
                    onClick={() => setShowSubstrateDetails(true)}
                    className="bg-white rounded-lg p-4 text-center border border-purple-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all duration-200 group"
                  >
                    <div className="text-2xl font-bold text-purple-600 mb-1 group-hover:text-purple-700">{composition.composition_stats.context_items_count}</div>
                    <div className="text-sm text-gray-600 group-hover:text-gray-700">Context Items</div>
                    <div className="text-xs text-gray-500 mt-1">Situational data</div>
                  </button>
                  <button
                    onClick={() => setShowSubstrateDetails(true)}
                    className="bg-white rounded-lg p-4 text-center border border-red-100 hover:border-red-200 hover:bg-red-50/50 transition-all duration-200 group"
                  >
                    <div className="text-2xl font-bold text-red-600 mb-1 group-hover:text-red-700">{composition.composition_stats.timeline_events_count}</div>
                    <div className="text-sm text-gray-600 group-hover:text-gray-700">Timeline Events</div>
                    <div className="text-xs text-gray-500 mt-1">Temporal markers</div>
                  </button>
                </div>

                {/* Document Health & Analytics */}
                <div className="bg-white rounded-lg border border-gray-100">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-sm font-medium text-gray-700">
                            Active Document
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {composition.composition_stats.total_substrate_references || 0} substrate references
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSubstrateDetails(!showSubstrateDetails)}
                          className="text-xs"
                        >
                          {showSubstrateDetails ? 
                            <><ChevronDown className="h-3 w-3 mr-1" />Hide Details</> :
                            <><ChevronRight className="h-3 w-3 mr-1" />View Substrate</>
                          }
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowVersionHistory(!showVersionHistory)}
                          className="text-xs"
                        >
                          <History className="h-3 w-3 mr-1" />
                          History ({versions.length})
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/baskets/${basketId}/memory`)}
                          className="text-xs"
                        >
                          Explore Memory
                        </Button>
                      </div>
                    </div>
                    
                    {/* Version History Expandable Section */}
                    {showVersionHistory && (
                      <div className="border-t border-gray-100 mt-4 p-4">
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Document History</h4>
                          <p className="text-xs text-gray-500">Previous versions and changes</p>
                        </div>
                        
                        {versions.length > 0 ? (
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {versions.slice(0, 10).map((version: any, index: number) => (
                              <div key={version.version_hash} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-semibold text-blue-600">v{versions.length - index}</span>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {version.version_hash.slice(0, 12)}...
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(version.created_at).toLocaleDateString()} at {new Date(version.created_at).toLocaleTimeString()}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <select 
                                    className="text-xs border border-gray-200 rounded px-2 py-1"
                                    value={compareTarget || ''}
                                    onChange={(e) => setCompareTarget(e.target.value || null)}
                                  >
                                    <option value="">Compare to current</option>
                                    <option value={version.version_hash}>View this version</option>
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <History className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <div className="text-sm">No version history</div>
                            <div className="text-xs text-gray-400 mt-1">Versions will appear as you make edits</div>
                          </div>
                        )}
                        
                        {/* Version Comparison Display */}
                        {compareTarget && (
                          <div className="mt-4 border-t border-gray-200 pt-4">
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-gray-700">Version Comparison</h5>
                              <p className="text-xs text-gray-500">Current vs {compareTarget.slice(0, 12)}...</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white border border-gray-200 rounded-lg p-3">
                                <div className="text-xs font-medium text-gray-700 mb-2">Current Version</div>
                                <div className="text-xs text-gray-600 max-h-32 overflow-y-auto">
                                  {document.content_raw || '(empty)'}
                                </div>
                              </div>
                              <div className="bg-white border border-gray-200 rounded-lg p-3">
                                <div className="text-xs font-medium text-gray-700 mb-2">Selected Version</div>
                                <div className="text-xs text-gray-600 max-h-32 overflow-y-auto">
                                  <VersionContent documentId={document.id} versionHash={compareTarget} />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Substrate Details Expandable Section */}
                  {showSubstrateDetails && composition.references && composition.references.length > 0 && (
                    <div className="border-t border-gray-100 p-4">
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Connected Substrate</h4>
                        <p className="text-xs text-gray-500">Knowledge sources that inform this document</p>
                      </div>
                      
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {composition.references.map((ref: any, index: number) => (
                          <div key={ref.reference?.id || index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex-shrink-0 mt-0.5">
                              {getSubstrateIcon(ref.substrate?.substrate_type || '')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {ref.substrate?.preview || ref.substrate?.title || `${ref.substrate?.substrate_type} reference`}
                                </div>
                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded ml-2">
                                  {ref.reference?.role || 'reference'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="capitalize">{ref.substrate?.substrate_type?.replace('_', ' ')}</span>
                                {ref.substrate?.created_at && (
                                  <span>Added {new Date(ref.substrate.created_at).toLocaleDateString()}</span>
                                )}
                                {ref.reference?.weight && (
                                  <span>Weight: {ref.reference.weight}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {composition.references.length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          <Database className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <div className="text-sm">No substrate references yet</div>
                          <div className="text-xs text-gray-400 mt-1">Switch to Edit mode to attach knowledge sources</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Async Composition Status */}
            {isAsyncComposition && workId && (
              <DocumentCompositionStatus
                documentId={document.id}
                workId={workId}
                statusUrl={statusUrl || undefined}
                onCompositionComplete={() => {
                  // Refresh composition and clear session storage
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem(`doc_${document.id}_work_id`);
                    sessionStorage.removeItem(`doc_${document.id}_status_url`);
                  }
                  // Reload page to get updated document
                  window.location.reload();
                }}
              />
            )}

            {/* Document Content */}
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-blue-500 rounded"></div>
                  <h3 className="text-lg font-medium text-gray-900">Document Content</h3>
                </div>
                {composition?.document?.content_raw ? (
                  <div className="prose prose-gray max-w-none">
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-6">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900 font-[system-ui]">
                        {composition.document.content_raw}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                    <div className="text-gray-400 mb-2">📝</div>
                    <div className="text-sm text-gray-500 mb-4">No authored content yet</div>
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
            </Card>
            
            {/* Related Insights Section */}
            {reflections.length > 0 && (
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-medium text-gray-900">Related Insights</h3>
                      <span className="text-sm text-gray-500">({reflections.length})</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/baskets/${basketId}/reflections`)}
                      className="text-xs"
                    >
                      View All Insights
                    </Button>
                  </div>
                  
                  {reflectionsLoading ? (
                    <div className="space-y-3">
                      <div className="animate-pulse bg-purple-100 h-16 rounded"></div>
                      <div className="animate-pulse bg-purple-100 h-12 rounded"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reflections.slice(0, 3).map((reflection, index) => (
                        <div key={reflection.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm">💡</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-gray-900 text-sm">
                                  Discovery #{reflections.length - index}
                                </h5>
                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                                  {formatReflectionAge(reflection.computation_timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {reflection.reflection_text.length > 200 
                                  ? reflection.reflection_text.substring(0, 200) + "..."
                                  : reflection.reflection_text
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {reflections.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-2xl mb-2">🤔</div>
                          <div className="text-sm mb-4">No insights discovered yet</div>
                          <div className="text-xs text-gray-400">Add more content to discover patterns and connections</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Edit Mode */}
        {mode === 'edit' && (
          <div className="space-y-6">
            
            {/* Maturity-Based Edit Guidance */}
            {maturity && maturityGuidance && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Authoring Guidance</h2>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      maturity.level === 1 ? 'bg-orange-100 text-orange-700' :
                      maturity.level === 2 ? 'bg-yellow-100 text-yellow-700' :
                      maturity.level === 3 ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      Level {maturity.level} - {maturity.phase}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 mb-4">{maturityGuidance.documentEditGuidance}</p>
                
                {/* Progressive Feature Unlocks */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className={`p-3 rounded-lg border ${
                    maturity.level >= 1 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${maturity.level >= 1 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={`text-sm font-medium ${
                        maturity.level >= 1 ? 'text-green-700' : 'text-gray-500'
                      }`}>Basic Authoring</span>
                    </div>
                    <p className="text-xs text-gray-600">Write and save documents</p>
                  </div>
                  
                  <div className={`p-3 rounded-lg border ${
                    maturity.level >= 2 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${maturity.level >= 2 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={`text-sm font-medium ${
                        maturity.level >= 2 ? 'text-green-700' : 'text-gray-500'
                      }`}>Memory Extraction</span>
                    </div>
                    <p className="text-xs text-gray-600">Convert to substrate for insights</p>
                  </div>
                  
                  <div className={`p-3 rounded-lg border ${
                    maturity.level >= 3 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${maturity.level >= 3 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={`text-sm font-medium ${
                        maturity.level >= 3 ? 'text-green-700' : 'text-gray-500'
                      }`}>AI Composition</span>
                    </div>
                    <p className="text-xs text-gray-600">Enhance with AI insights</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Document Editor */}
            <Card>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Title Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Title
                    </label>
                    <input 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Give your document a meaningful title..."
                    />
                  </div>
                  
                  {/* Content Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Content
                    </label>
                    <textarea 
                      className="w-full min-h-[300px] px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      value={prose} 
                      onChange={(e) => setProse(e.target.value)}
                      placeholder="Write your document content here..."
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex gap-3">
                      <Button 
                        onClick={saveDocument} 
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Document'}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={extractToMemory}
                        disabled={!prose.trim() || (maturity?.level === 1 && prose.trim().length < 100)}
                        title={maturity?.level === 1 && prose.trim().length < 100 ? "Add more content to extract meaningful insights" : ""}
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Extract to Memory
                      </Button>
                      
                      {maturity && maturity.level >= 3 && (
                        <Button 
                          variant="outline" 
                          onClick={async () => {
                            // Save current content first
                            const saveSuccess = await saveDocument();
                            if (!saveSuccess) return;
                            
                            try {
                              // Use the same compose API as DocumentCreateButton but with document context
                              const res = await fetch('/api/presentation/compose', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  title: title || 'Untitled Document',
                                  basket_id: basketId,
                                  narrative_sections: [{ id: 'intro', content: prose || 'Draft', order: 0 }],
                                  substrate_references: [],
                                  composition_context: { 
                                    intent: `Enhance and expand the existing document: "${title}"`,
                                    trace_id: crypto.randomUUID(),
                                    window: { days: 30 },
                                    source_document_id: document.id,
                                    existing_content: prose
                                  }
                                })
                              });
                              const data = await res.json();
                              if (!res.ok || !data?.document?.id) throw new Error(data?.error || 'Compose failed');
                              
                              // Handle async composition
                              if (data.composition_type === 'async_processing') {
                                sessionStorage.setItem(`doc_${data.document.id}_work_id`, data.work_id);
                                sessionStorage.setItem(`doc_${data.document.id}_status_url`, data.status_url);
                              }
                              
                              // Navigate to the newly composed document
                              router.push(`/baskets/${basketId}/documents/${data.document.id}`);
                            } catch (e) {
                              console.error('Failed to compose document:', e);
                              alert('Failed to compose document');
                            }
                          }}
                          className="border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          AI Compose
                        </Button>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      onClick={() => setMode('read')}
                      className="text-gray-600"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Helpful Tips */}
            {maturity && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Tips for your current level</h4>
                    {maturity.level === 1 && (
                      <p className="text-sm text-blue-800">
                        Focus on capturing your thoughts clearly. Once you have more content (100+ characters), 
                        you can extract it to memory to start building substrate connections.
                      </p>
                    )}
                    {maturity.level === 2 && (
                      <p className="text-sm text-blue-800">
                        Your basket is growing! Extract key sections to memory to build richer substrate connections. 
                        The more you extract, the better the insights become.
                      </p>
                    )}
                    {maturity.level >= 3 && (
                      <p className="text-sm text-blue-800">
                        You've unlocked AI composition! Use it to enhance your documents with AI-generated insights 
                        based on your substrate connections. The AI will help you discover patterns and relationships.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
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
