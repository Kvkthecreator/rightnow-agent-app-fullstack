"use client";

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Anchor,
  Blocks,
  Brain,
  Clock,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Star,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import SubstrateDetailModal from '@/components/substrate/SubstrateDetailModal';
import type { AnchorStatusSummary } from '@/lib/anchors/types';

/**
 * Building Blocks Client - Substrate Management UI
 *
 * Canon v2.1 compliant with context-aware quality metrics:
 * - Anchored vs Free blocks separation
 * - Usefulness scoring (usage tracking)
 * - Staleness detection (temporal awareness)
 * - Confidence-based quality indicators
 *
 * NOTE: Raw dumps are NOT shown here - they belong in /uploads page
 */

interface BlockWithMetrics {
  id: string;
  title: string | null;
  content: string | null;
  semantic_type: string | null;
  confidence_score: number | null;
  created_at: string;
  updated_at?: string | null;
  status: string | null;
  metadata?: Record<string, any> | null;

  // Context-aware quality metrics
  usefulness_score: number;
  times_referenced: number;
  staleness_days: number | null;
  last_validated_at: string | null;
}

interface ContextItemWithMetrics {
  id: string;
  title: string | null;
  semantic_category: string | null;
  semantic_meaning: string | null;
  created_at: string;
  metadata?: Record<string, any> | null;
}

interface BuildingBlocksResponse {
  blocks: BlockWithMetrics[];
  context_items: ContextItemWithMetrics[];
  stats: {
    total_blocks: number;
    total_context_items: number;
    anchored_blocks: number;
    stale_blocks: number;
    unused_blocks: number;
  };
}

const fetcher = (url: string) => fetchWithToken(url).then((res) => {
  if (!res.ok) throw new Error('Failed to load knowledge base');
  return res.json();
});

function formatTimestamp(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleString();
}

function confidenceBadge(score: number | null | undefined) {
  if (typeof score !== 'number') return null;
  if (score >= 0.85) return { label: 'High', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (score >= 0.7) return { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'Review', className: 'bg-rose-50 text-rose-700 border-rose-200' };
}

function usefulnessBadge(score: number) {
  if (score >= 0.9) return { label: 'Highly useful', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Star };
  if (score >= 0.5) return { label: 'Useful', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: TrendingUp };
  return { label: 'Unused', className: 'bg-slate-50 text-slate-600 border-slate-200', icon: Clock };
}

type FilterMode = 'all' | 'anchored' | 'free' | 'stale' | 'unused' | 'context_items';
type SortMode = 'usefulness' | 'recency' | 'confidence' | 'staleness';

interface BuildingBlocksClientProps {
  basketId: string;
}

export default function BuildingBlocksClient({ basketId }: BuildingBlocksClientProps) {
  const { data, error, isLoading, mutate } = useSWR<BuildingBlocksResponse>(
    `/api/baskets/${basketId}/building-blocks`,
    fetcher,
    { refreshInterval: 60_000 },
  );

  const { data: anchorsData } = useSWR<{ anchors: AnchorStatusSummary[] }>(
    `/api/baskets/${basketId}/anchors`,
    fetcher,
  );

  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortMode, setSortMode] = useState<SortMode>('usefulness');
  const [selected, setSelected] = useState<{ id: string; type: 'block' | 'context_item' } | null>(null);

  // Build anchor map for quick lookup
  const anchorMap = useMemo(() => {
    const map = new Map<string, AnchorStatusSummary>();
    (anchorsData?.anchors ?? []).forEach((anchor) => {
      if (anchor.linked_substrate?.id) {
        map.set(anchor.linked_substrate.id, anchor);
      }
    });
    return map;
  }, [anchorsData?.anchors]);

  // Filter and sort blocks
  const processedBlocks = useMemo(() => {
    if (!data?.blocks) return [];

    let filtered = data.blocks;

    // Apply filter mode
    if (filterMode === 'anchored') {
      filtered = filtered.filter(b => anchorMap.has(b.id));
    } else if (filterMode === 'free') {
      filtered = filtered.filter(b => !anchorMap.has(b.id));
    } else if (filterMode === 'stale') {
      filtered = filtered.filter(b => b.staleness_days !== null && b.staleness_days > 30);
    } else if (filterMode === 'unused') {
      filtered = filtered.filter(b => b.times_referenced === 0);
    }

    // Apply search query
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter((block) => {
        const title = block.title?.toLowerCase() ?? '';
        const semantic = block.semantic_type?.toLowerCase() ?? '';
        const content = block.content?.toLowerCase() ?? '';
        return title.includes(q) || semantic.includes(q) || content.includes(q);
      });
    }

    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortMode) {
        case 'usefulness':
          return b.usefulness_score - a.usefulness_score;
        case 'recency':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'confidence':
          return (b.confidence_score ?? 0) - (a.confidence_score ?? 0);
        case 'staleness':
          return (b.staleness_days ?? 0) - (a.staleness_days ?? 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [data?.blocks, anchorMap, filterMode, query, sortMode]);

  // Split into anchored and free for default view
  const anchoredBlocks = processedBlocks.filter(b => anchorMap.has(b.id));
  const freeBlocks = processedBlocks.filter(b => !anchorMap.has(b.id));

  // Filter context items
  const filteredContextItems = useMemo(() => {
    if (!data?.context_items) return [];
    if (!query.trim()) return data.context_items;

    const q = query.toLowerCase();
    return data.context_items.filter((item) => {
      const title = item.title?.toLowerCase() ?? '';
      const meaning = item.semantic_meaning?.toLowerCase() ?? '';
      return title.includes(q) || meaning.includes(q);
    });
  }, [data?.context_items, query]);

  // Calculate stats including anchored count
  const stats = useMemo(() => {
    if (!data) return null;
    return {
      ...data.stats,
      anchored_blocks: anchorMap.size,
    };
  }, [data, anchorMap.size]);

  const selectedAnchor = selected ? anchorMap.get(selected.id) : undefined;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Blocks className="h-5 w-5 text-indigo-600" />
              Building Blocks
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Manage extracted knowledge. Anchor important blocks to lock them in place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => mutate()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Link
              href={`/baskets/${basketId}/uploads`}
              className="text-sm text-slate-600 hover:text-indigo-600 flex items-center gap-1"
            >
              <FileText className="h-4 w-4" />
              View Uploads
            </Link>
          </div>
        </CardHeader>

        {/* Stats Bar */}
        <CardContent className="flex flex-wrap gap-3 border-t border-slate-100">
          <Badge variant="secondary" className="bg-slate-100 text-slate-700">
            {stats?.total_blocks ?? 0} total blocks
          </Badge>
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
            <Anchor className="h-3 w-3 mr-1" />
            {stats?.anchored_blocks ?? 0} anchored
          </Badge>
          <Badge variant="secondary" className="bg-amber-50 text-amber-700">
            <Clock className="h-3 w-3 mr-1" />
            {stats?.stale_blocks ?? 0} stale
          </Badge>
          <Badge variant="secondary" className="bg-slate-50 text-slate-600">
            {stats?.unused_blocks ?? 0} unused
          </Badge>
          <Badge variant="secondary" className="bg-purple-50 text-purple-700">
            <Brain className="h-3 w-3 mr-1" />
            {stats?.total_context_items ?? 0} entities
          </Badge>
        </CardContent>
      </Card>

      {/* Filter & Search Card */}
      <Card>
        <CardContent className="space-y-4">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filterMode === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterMode('all')}
            >
              All Blocks
            </Button>
            <Button
              size="sm"
              variant={filterMode === 'anchored' ? 'default' : 'outline'}
              onClick={() => setFilterMode('anchored')}
            >
              <Anchor className="h-3 w-3 mr-1" />
              Anchored
            </Button>
            <Button
              size="sm"
              variant={filterMode === 'free' ? 'default' : 'outline'}
              onClick={() => setFilterMode('free')}
            >
              Free Blocks
            </Button>
            <Button
              size="sm"
              variant={filterMode === 'stale' ? 'default' : 'outline'}
              onClick={() => setFilterMode('stale')}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Stale
            </Button>
            <Button
              size="sm"
              variant={filterMode === 'unused' ? 'default' : 'outline'}
              onClick={() => setFilterMode('unused')}
            >
              Unused
            </Button>
            <Button
              size="sm"
              variant={filterMode === 'context_items' ? 'default' : 'outline'}
              onClick={() => setFilterMode('context_items')}
            >
              <Brain className="h-3 w-3 mr-1" />
              Entities
            </Button>
          </div>

          {/* Search & Sort */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Search blocks, entities, or content..."
              />
            </div>

            {filterMode !== 'context_items' && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="usefulness">Sort by Usefulness</option>
                  <option value="recency">Sort by Recency</option>
                  <option value="confidence">Sort by Confidence</option>
                  <option value="staleness">Sort by Staleness</option>
                </select>
              </div>
            )}
          </div>

          {isLoading && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
              Loading building blocks…
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error instanceof Error ? error.message : String(error)}
            </div>
          )}

          {/* Content based on filter mode */}
          {!isLoading && !error && (
            <div className="space-y-6">
              {filterMode === 'context_items' ? (
                // Context Items View
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">Entities & Concepts</h2>
                    <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                      {filteredContextItems.length}
                    </Badge>
                  </div>
                  {filteredContextItems.length > 0 ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {filteredContextItems.map((item) => (
                        <Card key={item.id} className="border-slate-200 hover:border-indigo-300 transition-colors">
                          <CardContent className="space-y-3 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h3 className="text-base font-semibold text-slate-900">
                                  {item.title || 'Unnamed entity'}
                                </h3>
                                <p className="text-xs text-slate-500">
                                  {formatTimestamp(item.created_at)}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelected({ id: item.id, type: 'context_item' })}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </div>
                            {item.semantic_meaning && (
                              <p className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                                {item.semantic_meaning}
                              </p>
                            )}
                            {item.semantic_category && (
                              <Badge variant="outline" className="border-slate-200 text-slate-600">
                                {item.semantic_category}
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 text-center">
                      No entities found matching your search.
                    </div>
                  )}
                </section>
              ) : filterMode === 'all' ? (
                // Default view: Anchored + Free sections
                <>
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">Anchored Knowledge</h2>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                          {anchoredBlocks.length}
                        </Badge>
                      </div>
                      <Link
                        href={`/baskets/${basketId}/memory`}
                        className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Brain className="h-4 w-4" />
                        Manage Anchors
                      </Link>
                    </div>
                    <p className="text-sm text-slate-500">
                      Locked canonical knowledge. Won&apos;t change unless explicitly updated.
                    </p>

                    {anchoredBlocks.length > 0 ? (
                      <div className="grid gap-4 lg:grid-cols-2">
                        {anchoredBlocks.map((block) => {
                          const anchor = anchorMap.get(block.id);
                          const confidence = confidenceBadge(block.confidence_score);
                          const usefulness = usefulnessBadge(block.usefulness_score);
                          const isStale = block.staleness_days !== null && block.staleness_days > 30;

                          return (
                            <Card
                              key={block.id}
                              className={`border-slate-200 hover:border-indigo-300 transition-colors ${
                                isStale ? 'bg-amber-50/30' : ''
                              }`}
                            >
                              <CardContent className="space-y-3 p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3 className="text-base font-semibold text-slate-900">
                                        {anchor?.label || block.title || 'Untitled block'}
                                      </h3>
                                      <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                                        <Anchor className="h-3 w-3 mr-1" />
                                        Anchor
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                      Updated {formatTimestamp(block.updated_at)}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelected({ id: block.id, type: 'block' })}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </div>

                                {/* Quality Metrics */}
                                <div className="flex flex-wrap items-center gap-2">
                                  {confidence && (
                                    <Badge variant="outline" className={confidence.className}>
                                      {confidence.label}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className={usefulness.className}>
                                    <usefulness.icon className="h-3 w-3 mr-1" />
                                    {usefulness.label}
                                  </Badge>
                                  {isStale && (
                                    <Badge variant="outline" className="border-amber-200 text-amber-700">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Stale ({block.staleness_days}d)
                                    </Badge>
                                  )}
                                  {block.semantic_type && (
                                    <Badge variant="outline" className="border-slate-200 text-slate-600">
                                      {block.semantic_type}
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 text-center">
                        No anchors yet. Visit the Memory page to create anchors from your knowledge.
                      </div>
                    )}
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900">Free Blocks</h2>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        {freeBlocks.length}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      Emerging knowledge that evolves with new uploads. Convert to anchors when ready.
                    </p>

                    {freeBlocks.length > 0 ? (
                      <div className="grid gap-4 lg:grid-cols-2">
                        {freeBlocks.slice(0, 20).map((block) => {
                          const confidence = confidenceBadge(block.confidence_score);
                          const usefulness = usefulnessBadge(block.usefulness_score);
                          const isStale = block.staleness_days !== null && block.staleness_days > 30;

                          return (
                            <Card
                              key={block.id}
                              className={`border-slate-200 hover:border-indigo-300 transition-colors ${
                                isStale ? 'bg-amber-50/30' : ''
                              }`}
                            >
                              <CardContent className="space-y-3 p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <h3 className="text-base font-semibold text-slate-900">
                                      {block.title || 'Untitled block'}
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                      {formatTimestamp(block.created_at)}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelected({ id: block.id, type: 'block' })}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </div>

                                {/* Quality Metrics */}
                                <div className="flex flex-wrap items-center gap-2">
                                  {confidence && (
                                    <Badge variant="outline" className={confidence.className}>
                                      {confidence.label}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className={usefulness.className}>
                                    <usefulness.icon className="h-3 w-3 mr-1" />
                                    {usefulness.label}
                                  </Badge>
                                  {isStale && (
                                    <Badge variant="outline" className="border-amber-200 text-amber-700">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Stale ({block.staleness_days}d)
                                    </Badge>
                                  )}
                                  {block.semantic_type && (
                                    <Badge variant="outline" className="border-slate-200 text-slate-600">
                                      {block.semantic_type}
                                    </Badge>
                                  )}
                                </div>

                                {/* Quick Action */}
                                <div className="pt-2 border-t border-slate-100">
                                  <Link
                                    href={`/baskets/${basketId}/memory`}
                                    className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                  >
                                    <Anchor className="h-3 w-3" />
                                    Convert to Anchor
                                  </Link>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 text-center">
                        All blocks are anchored. Capture new knowledge to expand your understanding.
                      </div>
                    )}
                  </section>
                </>
              ) : (
                // Filtered view: Show all matching blocks
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {filterMode === 'anchored' && 'Anchored Blocks'}
                      {filterMode === 'free' && 'Free Blocks'}
                      {filterMode === 'stale' && 'Stale Blocks'}
                      {filterMode === 'unused' && 'Unused Blocks'}
                    </h2>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                      {processedBlocks.length}
                    </Badge>
                  </div>

                  {processedBlocks.length > 0 ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {processedBlocks.map((block) => {
                        const anchor = anchorMap.get(block.id);
                        const confidence = confidenceBadge(block.confidence_score);
                        const usefulness = usefulnessBadge(block.usefulness_score);
                        const isStale = block.staleness_days !== null && block.staleness_days > 30;

                        return (
                          <Card
                            key={block.id}
                            className={`border-slate-200 hover:border-indigo-300 transition-colors ${
                              isStale ? 'bg-amber-50/30' : ''
                            }`}
                          >
                            <CardContent className="space-y-3 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-base font-semibold text-slate-900">
                                      {anchor?.label || block.title || 'Untitled block'}
                                    </h3>
                                    {anchor && (
                                      <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                                        <Anchor className="h-3 w-3 mr-1" />
                                        Anchor
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {formatTimestamp(block.created_at)}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelected({ id: block.id, type: 'block' })}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Quality Metrics */}
                              <div className="flex flex-wrap items-center gap-2">
                                {confidence && (
                                  <Badge variant="outline" className={confidence.className}>
                                    {confidence.label}
                                  </Badge>
                                )}
                                <Badge variant="outline" className={usefulness.className}>
                                  <usefulness.icon className="h-3 w-3 mr-1" />
                                  {usefulness.label} ({block.times_referenced}×)
                                </Badge>
                                {isStale && (
                                  <Badge variant="outline" className="border-amber-200 text-amber-700">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {block.staleness_days}d stale
                                  </Badge>
                                )}
                                {block.semantic_type && (
                                  <Badge variant="outline" className="border-slate-200 text-slate-600">
                                    {block.semantic_type}
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 text-center">
                      No blocks found matching your filters.
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Substrate Detail Modal */}
      {selected && (
        <SubstrateDetailModal
          open
          onClose={() => setSelected(null)}
          substrateType={selected.type}
          substrateId={selected.id}
          basketId={basketId}
        />
      )}
    </div>
  );
}
