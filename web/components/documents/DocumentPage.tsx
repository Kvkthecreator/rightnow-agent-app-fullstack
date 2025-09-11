"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/Card';
import { Layers, Save, Upload, GitCompare, Activity, ArrowLeft, Link as LinkIcon, Brain, ChevronDown, ChevronRight, Database, FileText, MessageSquare, Clock, History } from 'lucide-react';
import { DocumentCompositionStatus } from './DocumentCompositionStatus';
import { fetchWithToken } from '@/lib/fetchWithToken';
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
  const [analyze, setAnalyze] = useState<any | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [compareTarget, setCompareTarget] = useState<string | null>(null);
  const [reflections, setReflections] = useState<ReflectionDTO[]>([]);
  const [reflectionsLoading, setReflectionsLoading] = useState(false);
  const [showSubstrateDetails, setShowSubstrateDetails] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

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
        
        // Load analyze data
        const analyzeResponse = await fetch(`/api/documents/${document.id}/analyze-lite`);
        if (analyzeResponse.ok) {
          const analyzeData = await analyzeResponse.json();
          setAnalyze(analyzeData.analyze);
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
    } catch (e) {
      alert('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const extractToMemory = async () => {
    try {
      const dump_request_id = crypto.randomUUID();
      const res = await fetch('/api/dumps/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basket_id: basketId,
          dump_request_id,
          text_dump: prose,
          meta: { source: 'document_extract', document_id: document.id }
        })
      });
      if (!res.ok) throw new Error('Extract failed');
      alert('Extracted to memory. Substrate proposals will arrive shortly.');
    } catch (e) {
      alert('Failed to extract to memory');
    }
  };

  const attachReference = async (type: string, id: string, role?: string) => {
    try {
      const res = await fetch(`/api/documents/${document.id}/references`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ substrate_type: type, substrate_id: id, role: role || null })
      });
      if (!res.ok) throw new Error('Attach failed');
      if (mode === 'read') {
        // Refresh composition
        const r = await fetch(`/api/documents/${document.id}/composition`);
        if (r.ok) setComposition(await r.json());
      }
      alert('Attached');
    } catch (e) {
      alert('Failed to attach reference');
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
                          <div className={`w-3 h-3 rounded-full ${analyze?.is_stale ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                          <span className="text-sm font-medium text-gray-700">
                            {analyze?.is_stale ? 'Needs Update' : 'Active Document'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {composition.composition_stats.total_substrate_references || 0} substrate references
                        </div>
                        {analyze && (
                          <div className="text-sm text-gray-600">
                            Weight: {analyze.avg_reference_weight || 'N/A'}
                          </div>
                        )}
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
                    
                    {/* Document Analytics Row */}
                    {analyze && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 rounded-lg p-3">
                        <div className="text-center">
                          <div className="text-sm font-semibold text-gray-900">
                            {new Date(analyze.version_created_at || document.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">Version Created</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-gray-900">
                            {analyze.last_substrate_updated_at ? new Date(analyze.last_substrate_updated_at).toLocaleDateString() : '—'}
                          </div>
                          <div className="text-xs text-gray-500">Last Substrate Update</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-sm font-semibold ${analyze.is_stale ? 'text-yellow-600' : 'text-green-600'}`}>
                            {analyze.is_stale ? 'Stale' : 'Fresh'}
                          </div>
                          <div className="text-xs text-gray-500">Document Status</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-blue-600">
                            {analyze.avg_reference_weight ? Number(analyze.avg_reference_weight).toFixed(1) : '0'}
                          </div>
                          <div className="text-xs text-gray-500">Avg Reference Weight</div>
                        </div>
                      </div>
                    )}
                    
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

        {/* Edit */}
        {mode === 'edit' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input className="w-full p-3 border border-gray-200 rounded text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Authored Prose</label>
              <textarea className="w-full min-h-[260px] p-3 border border-gray-200 rounded text-sm" value={prose} onChange={(e) => setProse(e.target.value)} />
              <div className="flex gap-2 mt-3">
                <Button onClick={saveDocument} disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? 'Saving...' : 'Save'}</Button>
                <Button variant="outline" onClick={extractToMemory}><Upload className="h-4 w-4 mr-1" />Extract to Memory</Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><LinkIcon className="h-4 w-4"/>Attach Substrate</label>
              <AttachRefForm onAttach={attachReference} />
            </div>
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

function AttachRefForm({ onAttach }: { onAttach: (type: string, id: string, role?: string) => void }) {
  const [type, setType] = useState('block');
  const [id, setId] = useState('');
  const [role, setRole] = useState('');
  return (
    <div className="flex flex-col md:flex-row gap-2">
      <select className="border p-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
        <option value="block">block</option>
        <option value="dump">dump</option>
        <option value="context_item">context_item</option>
        <option value="timeline_event">timeline_event</option>
      </select>
      <input className="border p-2 flex-1 text-sm" placeholder="substrate_id (UUID)" value={id} onChange={(e) => setId(e.target.value)} />
      <input className="border p-2 flex-1 text-sm" placeholder="role (optional)" value={role} onChange={(e) => setRole(e.target.value)} />
      <Button onClick={() => onAttach(type, id, role)} size="sm">Attach</Button>
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
