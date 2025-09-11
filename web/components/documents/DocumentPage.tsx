"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/Card';
import { Layers, Save, Upload, GitCompare, Activity, ArrowLeft, Link as LinkIcon, Brain } from 'lucide-react';
import { DocumentCompositionStatus } from './DocumentCompositionStatus';
import { fetchWithToken } from '@/lib/fetchWithToken';
import type { GetReflectionsResponse, ReflectionDTO } from '@/shared/contracts/reflections';

type Mode = 'read' | 'edit' | 'compare' | 'analyze';

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

  // Check for async composition status
  const workId = typeof window !== 'undefined' ? sessionStorage.getItem(`doc_${document.id}_work_id`) : null;
  const statusUrl = typeof window !== 'undefined' ? sessionStorage.getItem(`doc_${document.id}_status_url`) : null;
  const isAsyncComposition = document.metadata?.composition_status === 'pending' || document.metadata?.composition_status === 'processing';

  // Load composition (read view)
  useEffect(() => {
    if (mode !== 'read') return;
    (async () => {
      const res = await fetch(`/api/documents/${document.id}/composition`);
      if (res.ok) setComposition(await res.json());
    })();
  }, [document.id, mode]);

  // Load analyze (analyze view)
  useEffect(() => {
    if (mode !== 'analyze') return;
    (async () => {
      const res = await fetch(`/api/documents/${document.id}/analyze-lite`);
      if (res.ok) {
        const data = await res.json();
        setAnalyze(data.analyze);
      }
    })();
  }, [document.id, mode]);

  // Load versions (compare view)
  useEffect(() => {
    if (mode !== 'compare') return;
    (async () => {
      const res = await fetch(`/api/documents/${document.id}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.items || []);
      }
    })();
  }, [document.id, mode]);

  // Load reflections (read view)
  useEffect(() => {
    if (mode !== 'read') return;
    (async () => {
      try {
        setReflectionsLoading(true);
        
        const url = new URL(`/api/baskets/${basketId}/reflections`, window.location.origin);
        url.searchParams.set("limit", "5"); // Show recent 5 reflections for context
        
        const response = await fetchWithToken(url.toString());
        if (!response.ok) {
          throw new Error("Failed to load reflections");
        }

        const data: GetReflectionsResponse = await response.json();
        setReflections(data.reflections);
      } catch (err) {
        console.error('Failed to fetch reflections:', err);
        setReflections([]);
      } finally {
        setReflectionsLoading(false);
      }
    })();
  }, [basketId, mode]);

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
              <TabsTrigger value="read">Read</TabsTrigger>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="compare">Compare</TabsTrigger>
              <TabsTrigger value="analyze">Analyze</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Modes */}
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        {/* Read */}
        {mode === 'read' && (
          <div className="space-y-6">
            {/* Composition Status */}
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

            <Card>
              <div className="p-4">
                {composition?.document?.content_raw ? (
                  <div className="prose max-w-none">
                    <div className="bg-white border border-gray-100 rounded p-4">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900">
                        {composition.document.content_raw}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No authored content yet</div>
                )}
              </div>
            </Card>
            {composition && (
              <Card>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                    <Layers className="h-3 w-3" /> Composition
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-center text-xs">
                    <div><div className="font-semibold text-blue-600">{composition.composition_stats.blocks_count}</div><div className="text-gray-500">Blocks</div></div>
                    <div><div className="font-semibold text-green-600">{composition.composition_stats.dumps_count}</div><div className="text-gray-500">Dumps</div></div>
                    <div><div className="font-semibold text-purple-600">{composition.composition_stats.context_items_count}</div><div className="text-gray-500">Context</div></div>
                    <div><div className="font-semibold text-red-600">{composition.composition_stats.timeline_events_count}</div><div className="text-gray-500">Timeline</div></div>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Related Insights Section */}
            {reflections.length > 0 && (
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Brain className="h-4 w-4 text-purple-600" />
                      Related Insights
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/baskets/${basketId}/reflections`)}
                      className="text-xs"
                    >
                      View All
                    </Button>
                  </div>
                  
                  {reflectionsLoading ? (
                    <div className="space-y-3">
                      <div className="animate-pulse bg-purple-100 h-16 rounded"></div>
                      <div className="animate-pulse bg-purple-100 h-12 rounded"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reflections.slice(0, 2).map((reflection, index) => (
                        <div key={reflection.id} className="bg-purple-50 border border-purple-200 rounded p-3">
                          <div className="flex items-start gap-2">
                            <span className="text-sm mt-0.5">💡</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="font-medium text-gray-900 text-sm">
                                  Insight #{reflections.length - index}
                                </h5>
                                <span className="text-xs text-gray-500">
                                  {formatReflectionAge(reflection.computation_timestamp)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                {reflection.reflection_text.length > 150 
                                  ? reflection.reflection_text.substring(0, 150) + "..."
                                  : reflection.reflection_text
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {reflections.length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No insights discovered yet. Add more content to your knowledge base.
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

        {/* Compare */}
        {mode === 'compare' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600"><GitCompare className="h-4 w-4"/>Select a version to compare against current</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded p-3">
                <div className="text-xs text-gray-500 mb-2">Current</div>
                <pre className="text-xs whitespace-pre-wrap">{document.content_raw || ''}</pre>
              </div>
              <div className="border rounded p-3">
                <div className="text-xs text-gray-500 mb-2">Version</div>
                <select className="w-full border p-2 text-sm mb-2" value={compareTarget || ''} onChange={(e) => setCompareTarget(e.target.value || null)}>
                  <option value="">Select a version</option>
                  {versions.map(v => (
                    <option key={v.version_hash} value={v.version_hash}>{v.version_hash.slice(0,12)} — {new Date(v.created_at).toLocaleString()}</option>
                  ))}
                </select>
                {compareTarget && (
                  <VersionContent documentId={document.id} versionHash={compareTarget} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analyze */}
        {mode === 'analyze' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600"><Activity className="h-4 w-4"/>Analyze Lite</div>
            {analyze ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
                <Metric label="Blocks" value={analyze.blocks_count} color="text-blue-600" />
                <Metric label="Dumps" value={analyze.dumps_count} color="text-green-600" />
                <Metric label="Context" value={analyze.context_items_count} color="text-purple-600" />
                <Metric label="Timeline" value={analyze.timeline_events_count} color="text-red-600" />
                <Metric label="Avg Weight" value={analyze.avg_reference_weight} />
                <Metric label="Stale" value={analyze.is_stale ? 'Yes' : 'No'} />
                <Metric label="Ver. Created" value={new Date(analyze.version_created_at || document.created_at).toLocaleString()} />
                <Metric label="Last Substrate" value={analyze.last_substrate_updated_at ? new Date(analyze.last_substrate_updated_at).toLocaleString() : '—'} />
              </div>
            ) : (
              <div className="text-sm text-gray-500">No analyze data</div>
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
