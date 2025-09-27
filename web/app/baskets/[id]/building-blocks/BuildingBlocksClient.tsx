"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Clock,
  Database,
  FileText,
  Layers,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CreateBlockModal from '@/components/building-blocks/CreateBlockModal';
import CreateContextItemModal from '@/components/building-blocks/CreateContextItemModal';
import SubstrateDetailModal from '@/components/substrate/SubstrateDetailModal';
import AddMemoryModal from '@/components/memory/AddMemoryModal';

interface DerivedBlock {
  id: string;
  title: string | null;
  semantic_type: string | null;
  confidence_score: number | null;
  created_at: string;
  updated_at?: string | null;
  state?: string | null;
  metadata?: Record<string, any> | null;
}

interface DerivedContextItem {
  id: string;
  title: string | null;
  semantic_category: string | null;
  semantic_meaning: string | null;
  created_at: string;
  metadata?: Record<string, any> | null;
}

interface WorkItemSummary {
  work_id: string;
  work_type: string;
  status: string | null;
  created_at: string;
}

interface CaptureSummary {
  dump: {
    id: string;
    body_md: string | null;
    file_url: string | null;
    processing_status: string | null;
    created_at: string;
    source_meta: Record<string, any> | null;
  };
  derived_blocks: DerivedBlock[];
  derived_context_items: DerivedContextItem[];
  work_items: WorkItemSummary[];
}

interface BuildingBlocksResponse {
  captures: CaptureSummary[];
  stats: {
    captures: number;
    dumps: number;
    blocks: number;
    context_items: number;
  };
  orphans: {
    blocks: DerivedBlock[];
    context_items: DerivedContextItem[];
  };
}

interface BuildingBlocksClientProps {
  basketId: string;
}

const WORK_TYPE_LABELS: Record<string, string> = {
  P0_CAPTURE: 'Capture',
  P1_SUBSTRATE: 'Interpretation',
  P2_GRAPH: 'Graph Mapping',
  P3_REFLECTION: 'Insight Composition',
};

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function formatRelativeDays(value: string) {
  const diff = new Date(value).getTime() - Date.now();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  return formatter.format(days, 'day');
}

function confidenceLabel(score: number | null | undefined) {
  if (typeof score !== 'number') return null;
  if (score >= 0.85) return 'High confidence';
  if (score >= 0.7) return 'Medium confidence';
  return 'Low confidence';
}

function statusBadge(status: string | null) {
  if (!status) return { label: 'pending', className: 'bg-slate-100 text-slate-600' };
  const normalized = status.toLowerCase();
  if (['processing', 'claimed', 'cascading'].includes(normalized)) {
    return { label: 'in-progress', className: 'bg-blue-100 text-blue-700' };
  }
  if (['completed', 'success'].includes(normalized)) {
    return { label: 'completed', className: 'bg-green-100 text-green-700' };
  }
  if (['failed', 'error'].includes(normalized)) {
    return { label: 'failed', className: 'bg-red-100 text-red-700' };
  }
  return { label: normalized, className: 'bg-slate-100 text-slate-600' };
}

function workTypeLabel(type: string) {
  return WORK_TYPE_LABELS[type] ?? type.replace(/_/g, ' ');
}

export default function BuildingBlocksClient({ basketId }: BuildingBlocksClientProps) {
  const [data, setData] = useState<BuildingBlocksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateBlock, setShowCreateBlock] = useState(false);
  const [showCreateContextItem, setShowCreateContextItem] = useState(false);
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [selectedSubstrate, setSelectedSubstrate] = useState<{
    type: 'raw_dump' | 'block' | 'context_item' | 'relationship' | 'timeline_event';
    id: string;
  } | null>(null);

  const searchParams = useSearchParams();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchWithToken(`/api/baskets/${basketId}/building-blocks`);
      if (!response.ok) {
        throw new Error('Failed to load knowledge base');
      }
      const payload: BuildingBlocksResponse = await response.json();
      setData(payload);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  }, [basketId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!data) return;
    const highlightId = searchParams.get('highlight');
    const highlightType = searchParams.get('type');
    if (!highlightId || !highlightType) return;

    if (highlightType === 'dump' || highlightType === 'raw_dump') {
      if (data.captures.some(capture => capture.dump.id === highlightId)) {
        setSelectedSubstrate({ type: 'raw_dump', id: highlightId });
      }
      return;
    }

    if (highlightType === 'block') {
      const capture = data.captures.find(c => c.derived_blocks.some(block => block.id === highlightId));
      if (capture) {
        setSelectedSubstrate({ type: 'block', id: highlightId });
      }
      return;
    }

    if (highlightType === 'context_item') {
      const capture = data.captures.find(c => c.derived_context_items.some(item => item.id === highlightId));
      if (capture) {
        setSelectedSubstrate({ type: 'context_item', id: highlightId });
      }
    }
  }, [data, searchParams]);

  const filteredCaptures = useMemo(() => {
    if (!data) return [] as CaptureSummary[];
    if (!searchQuery.trim()) return data.captures;

    const query = searchQuery.toLowerCase();
    return data.captures.filter(capture => {
      const dumpMatch = (capture.dump.body_md || '').toLowerCase().includes(query);
      const blockMatch = capture.derived_blocks.some(block =>
        (block.title || '').toLowerCase().includes(query) ||
        (block.semantic_type || '').toLowerCase().includes(query)
      );
      const contextMatch = capture.derived_context_items.some(item =>
        (item.title || '').toLowerCase().includes(query) ||
        (item.semantic_meaning || '').toLowerCase().includes(query)
      );
      return dumpMatch || blockMatch || contextMatch;
    });
  }, [data, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-40 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-40 animate-pulse rounded-lg bg-slate-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h3 className="text-sm font-semibold text-red-700">Unable to load knowledge base</h3>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={loadData}>
          Try again
        </Button>
      </div>
    );
  }

  if (!data || data.captures.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Layers className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Let’s capture your first thought</h3>
          <p className="text-sm text-slate-600">
            Add a thought, upload a file, or paste research. YARNNN will ingest each capture and turn it into structured knowledge you can reuse.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => setShowAddMemory(true)}>
              <FileText className="mr-2 h-4 w-4" />
              Capture a Thought
            </Button>
            <Button variant="outline" onClick={() => setShowCreateBlock(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Block
            </Button>
          </div>
        </div>
        <AddMemoryModal
          basketId={basketId}
          open={showAddMemory}
          onClose={() => setShowAddMemory(false)}
          onSuccess={loadData}
        />
        <CreateBlockModal
          basketId={basketId}
          open={showCreateBlock}
          onClose={() => setShowCreateBlock(false)}
          onSuccess={loadData}
        />
        <CreateContextItemModal
          basketId={basketId}
          open={showCreateContextItem}
          onClose={() => setShowCreateContextItem(false)}
          onSuccess={loadData}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Knowledge Base Timeline</h2>
            <p className="text-sm text-slate-600">
              Track each capture from raw input to structured knowledge. See how YARNNN interprets your thoughts into blocks, meanings, and downstream work.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCreateContextItem(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Context Item
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCreateBlock(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Block
            </Button>
            <Button onClick={() => setShowAddMemory(true)}>
              <FileText className="mr-2 h-4 w-4" />
              Add Thought
            </Button>
          </div>
        </div>

        <Card className="border border-slate-200">
          <CardContent className="flex flex-wrap gap-6 py-5">
            <div>
              <p className="text-xs uppercase text-slate-500">Captures</p>
              <p className="text-2xl font-semibold text-slate-900">{data.stats.captures}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Structured blocks</p>
              <p className="text-2xl font-semibold text-slate-900">{data.stats.blocks}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Semantic meanings</p>
              <p className="text-2xl font-semibold text-slate-900">{data.stats.context_items}</p>
            </div>
          </CardContent>
        </Card>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search captures, blocks, or context"
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-6">
          {filteredCaptures.map(capture => {
            const { dump, derived_blocks, derived_context_items, work_items } = capture;
            const hasOutputs = derived_blocks.length > 0 || derived_context_items.length > 0;
            const processingStatus = dump.processing_status?.toLowerCase();

            return (
              <Card key={dump.id} className={cn('border border-slate-200', !hasOutputs && 'border-amber-200 bg-amber-50/40')}>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <CardTitle className="text-base font-semibold text-slate-900">
                        Capture from {formatDate(dump.created_at)}
                      </CardTitle>
                      {dump.file_url && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                          File
                        </Badge>
                      )}
                      {processingStatus && (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 capitalize">
                          {processingStatus}
                        </Badge>
                      )}
                      {hasOutputs ? (
                        <Badge variant="secondary" className="bg-green-50 text-green-700">
                          Structured
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                          Pending interpretation
                        </Badge>
                      )}
                    </div>
                    {dump.source_meta?.ingest_trace_id && (
                      <p className="text-xs text-slate-500">Trace ID: {dump.source_meta.ingest_trace_id}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSubstrate({ type: 'raw_dump', id: dump.id })}>
                      <Eye className="mr-2 h-4 w-4" />
                      View source
                    </Button>
                    {dump.file_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={dump.file_url} target="_blank" rel="noopener noreferrer">
                          <Sparkles className="mr-2 h-4 w-4" />
                          Open file
                        </a>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {dump.body_md && (
                    <div className="rounded-lg border border-slate-100 bg-white p-4">
                      <p className="text-sm text-slate-700 whitespace-pre-line">
                        {dump.body_md.slice(0, 1000)}{dump.body_md.length > 1000 ? '…' : ''}
                      </p>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Database className="h-4 w-4 text-blue-500" />
                        Structured knowledge
                      </h4>
                      {derived_blocks.length > 0 ? (
                        <div className="space-y-2">
                          {derived_blocks.map(block => {
                            const label = confidenceLabel(block.confidence_score);
                            return (
                              <div key={block.id} className="rounded-lg border border-slate-100 bg-white p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">
                                      {block.title || 'Untitled block'}
                                    </p>
                                    <p className="text-xs text-slate-500">{block.semantic_type || 'Uncategorised'}</p>
                                  </div>
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedSubstrate({ type: 'block', id: block.id })}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                                  <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                    Captured {formatRelativeDays(block.created_at)}
                                  </Badge>
                                  {block.state && (
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 uppercase">
                                      {block.state.toLowerCase()}
                                    </Badge>
                                  )}
                                  {label && (
                                    <Badge variant="secondary" className="bg-green-50 text-green-700">
                                      {label}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No blocks created yet.</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <MessageSquare className="h-4 w-4 text-purple-500" />
                        Semantic links
                      </h4>
                      {derived_context_items.length > 0 ? (
                        <div className="space-y-2">
                          {derived_context_items.map(item => (
                            <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-white p-3">
                              <div>
                                <p className="text-sm font-medium text-slate-900">{item.title || 'Untitled meaning'}</p>
                                <p className="text-xs text-slate-500">{item.semantic_category || 'Context item'}</p>
                                {item.semantic_meaning && (
                                  <p className="mt-2 text-xs text-slate-600">{item.semantic_meaning}</p>
                                )}
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedSubstrate({ type: 'context_item', id: item.id })}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No context items yet.</p>
                      )}
                    </div>
                  </div>

                  {work_items.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Clock className="h-4 w-4 text-slate-500" />
                        Pipeline activity
                      </h4>
                      <div className="space-y-2">
                        {work_items.map(item => {
                          const badge = statusBadge(item.status);
                          return (
                            <div key={item.work_id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3">
                              <div>
                                <p className="text-sm font-medium text-slate-800">{workTypeLabel(item.work_type)}</p>
                                <p className="text-xs text-slate-500">{formatDate(item.created_at)}</p>
                              </div>
                              <Badge variant="secondary" className={badge.className}>
                                {badge.label}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {(data.orphans.blocks.length > 0 || data.orphans.context_items.length > 0) && (
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Unlinked substrate</CardTitle>
              <p className="text-xs text-slate-500">
                These items do not have a recorded capture reference. They may have been created before provenance tracking or imported manually.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.orphans.blocks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-800">Blocks</h4>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {data.orphans.blocks.map(block => (
                      <div key={block.id} className="rounded-lg border border-slate-100 bg-white p-3">
                        <p className="text-sm font-medium text-slate-900 truncate">{block.title || 'Untitled block'}</p>
                        <p className="text-xs text-slate-500 mt-1">{block.semantic_type || 'Uncategorised'}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <span>{formatDate(block.created_at)}</span>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedSubstrate({ type: 'block', id: block.id })}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.orphans.context_items.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-800">Context items</h4>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {data.orphans.context_items.map(item => (
                      <div key={item.id} className="rounded-lg border border-slate-100 bg-white p-3">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.title || 'Untitled meaning'}</p>
                        <p className="text-xs text-slate-500 mt-1">{item.semantic_category || 'Context item'}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <span>{formatDate(item.created_at)}</span>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedSubstrate({ type: 'context_item', id: item.id })}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <CreateBlockModal
        basketId={basketId}
        open={showCreateBlock}
        onClose={() => setShowCreateBlock(false)}
        onSuccess={loadData}
      />
      <CreateContextItemModal
        basketId={basketId}
        open={showCreateContextItem}
        onClose={() => setShowCreateContextItem(false)}
        onSuccess={loadData}
      />
      <AddMemoryModal
        basketId={basketId}
        open={showAddMemory}
        onClose={() => setShowAddMemory(false)}
        onSuccess={loadData}
      />

      {selectedSubstrate && (
        <SubstrateDetailModal
          open={Boolean(selectedSubstrate)}
          onClose={() => setSelectedSubstrate(null)}
          substrateType={selectedSubstrate.type}
          substrateId={selectedSubstrate.id}
          basketId={basketId}
        />
      )}
    </>
  );
}
