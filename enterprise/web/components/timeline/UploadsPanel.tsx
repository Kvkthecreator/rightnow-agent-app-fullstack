"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  CloudUpload,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import SubstrateDetailModal from '@/components/substrate/SubstrateDetailModal';

interface DerivedBlock {
  id: string;
  title: string | null;
  semantic_type: string | null;
  confidence_score: number | null;
  metadata?: Record<string, any> | null;
  state?: string | null;
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
    body_preview: string | null;
    file_url: string | null;
    processing_status: string | null;
    created_at: string;
    source_meta: Record<string, any> | null;
    document_id: string | null;
  };
  derived_blocks: DerivedBlock[];
  work_items: WorkItemSummary[];
}

interface UploadsResponse {
  uploads: CaptureSummary[];
  stats: {
    total_uploads: number;
    total_blocks: number;
    files: number;
    text: number;
  };
}

const fetcher = (url: string) => fetchWithToken(url).then((res) => {
  if (!res.ok) throw new Error('Failed to load uploads');
  return res.json();
});

const TYPE_LABELS: Record<string, string> = {
  file: 'File upload',
  text: 'Manual text',
  email: 'Email forward',
  api: 'API ingestion',
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  return date.toLocaleString();
}

function uploadLabel(capture: CaptureSummary) {
  const meta = capture.dump.source_meta || {};
  if (meta.original_filename) return meta.original_filename as string;
  if (capture.dump.file_url) {
    const parts = capture.dump.file_url.split('/');
    return decodeURIComponent(parts[parts.length - 1]);
  }
  return 'Manual capture';
}

function uploadType(capture: CaptureSummary) {
  const meta = capture.dump.source_meta || {};
  if (meta.ingest_type) return String(meta.ingest_type);
  if (capture.dump.file_url) return 'file';
  return 'text';
}

function describeWork(items: WorkItemSummary[]) {
  if (!items.length) return 'No agent activity yet';
  const latest = items[items.length - 1];
  const status = latest.status ? latest.status.toLowerCase() : 'pending';
  const label = status.includes('completed') ? 'Completed' : status;
  return `${label} • ${new Date(latest.created_at).toLocaleString()}`;
}

interface TimelineUploadsPanelProps {
  basketId: string;
  highlightDumpId?: string | null;
}

export default function TimelineUploadsPanel({ basketId, highlightDumpId }: TimelineUploadsPanelProps) {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<UploadsResponse>(
    `/api/baskets/${basketId}/uploads`,
    fetcher,
    { refreshInterval: 60_000 },
  );

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'file' | 'text'>('all');
  const [detail, setDetail] = useState<{ type: 'raw_dump' | 'block'; id: string } | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);

  const uploads = useMemo(() => {
    if (!data?.uploads) return [] as CaptureSummary[];
    let captures = data.uploads;
    if (typeFilter !== 'all') {
      captures = captures.filter((capture) => uploadType(capture) === typeFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      captures = captures.filter((capture) => {
        const label = uploadLabel(capture).toLowerCase();
        const meta = JSON.stringify(capture.dump.source_meta || {}).toLowerCase();
        return label.includes(q) || meta.includes(q);
      });
    }
    return captures;
  }, [data?.uploads, query, typeFilter]);

  useEffect(() => {
    if (!highlightDumpId) return;
    const match = uploads.find((capture) => capture.dump.id === highlightDumpId);
    if (match) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [highlightDumpId, uploads]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CloudUpload className="h-5 w-5 text-indigo-600" />
              Captured memories
            </CardTitle>
            <p className="text-sm text-slate-500">
              Immutable captures that seed block evolution.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => mutate()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Badge variant="secondary" className="bg-slate-100 text-slate-700">{data?.stats.total_uploads ?? 0} uploads</Badge>
          <Badge variant="secondary" className="bg-green-50 text-green-700">{data?.stats.total_blocks ?? 0} blocks extracted</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Search uploads by name or metadata"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <Button
                size="sm"
                variant={typeFilter === 'all' ? 'default' : 'ghost'}
                onClick={() => setTypeFilter('all')}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={typeFilter === 'file' ? 'default' : 'ghost'}
                onClick={() => setTypeFilter('file')}
              >
                Files
              </Button>
              <Button
                size="sm"
                variant={typeFilter === 'text' ? 'default' : 'ghost'}
                onClick={() => setTypeFilter('text')}
              >
                Text
              </Button>
            </div>
          </div>

          {isLoading && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
              Loading uploads…
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error instanceof Error ? error.message : String(error)}
            </div>
          )}

          {!isLoading && !error && !uploads.length && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-sm text-slate-500">
              No uploads yet. Add thoughts or drop files to seed your knowledge base.
            </div>
          )}

          <div className="grid gap-4">
            {uploads.map((capture) => {
              const label = uploadLabel(capture);
              const type = uploadType(capture);
              const derivedCount = capture.derived_blocks.length;
              const isHighlighted = capture.dump.id === highlightDumpId;

              return (
                <Card
                  key={capture.dump.id}
                  className={`border-slate-200 transition hover:border-indigo-200 hover:shadow-sm ${isHighlighted ? 'border-amber-400 shadow-md' : ''}`}
                >
                  <CardContent className="flex flex-col gap-4 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900">{label}</h3>
                          <Badge variant="outline" className="border-slate-200 text-slate-600">
                            {TYPE_LABELS[type] ?? type}
                          </Badge>
                          {isHighlighted && (
                            <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                              Highlighted
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">Captured {formatTimestamp(capture.dump.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {capture.dump.document_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/baskets/${basketId}/documents/${capture.dump.document_id}`)}
                            className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          >
                            <ArrowRight className="h-3.5 w-3.5 mr-1" />
                            View Document
                          </Button>
                        )}
                        {derivedCount > 0 ? (
                          <Badge variant="secondary" className="bg-green-50 text-green-700">
                            <Sparkles className="h-3.5 w-3.5" /> {derivedCount} blocks extracted
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                            Awaiting extraction
                          </Badge>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setDetail({ type: 'raw_dump', id: capture.dump.id })}>
                          <FileText className="h-4 w-4" /> Details
                        </Button>
                      </div>
                    </div>

                    {capture.dump.source_meta?.notes && (
                      <p className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                        {String(capture.dump.source_meta.notes)}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" /> {capture.derived_blocks.length} blocks
                      </span>
                      <span className="flex items-center gap-1">
                        <CloudUpload className="h-3 w-3" /> {capture.dump.processing_status || 'pending'}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" /> {describeWork(capture.work_items)}
                      </span>
                    </div>

                    {capture.derived_blocks.length > 0 && (
                      <div className="rounded border border-slate-200 bg-slate-50 p-3 space-y-2">
                        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Extracted blocks
                        </div>
                        <div className="grid gap-2">
                          {capture.derived_blocks.map((block) => (
                            <button
                              key={block.id}
                              onClick={() => setDetail({ type: 'block', id: block.id })}
                              className="w-full text-left rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-indigo-200 hover:text-indigo-700"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium">{block.title || 'Untitled block'}</span>
                                {block.semantic_type && (
                                  <Badge variant="outline" className="text-xs border-slate-200 text-slate-600">
                                    {block.semantic_type}
                                  </Badge>
                                )}
                              </div>
                              {block.metadata?.knowledge_ingredients?.summary && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                  {block.metadata.knowledge_ingredients.summary}
                                </p>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {detail && (
        <SubstrateDetailModal
          open
          onClose={() => setDetail(null)}
          substrateType={detail.type}
          substrateId={detail.id}
          basketId={basketId}
        />
      )}
    </div>
  );
}
