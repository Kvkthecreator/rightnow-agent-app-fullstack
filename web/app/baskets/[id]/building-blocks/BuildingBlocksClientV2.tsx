"use client";

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Blocks, FileText, RefreshCw, Search, Brain, Database } from 'lucide-react';
import SubstrateDetailModal from '@/components/substrate/SubstrateDetailModal';

/**
 * BuildingBlocksClientV2 - Simplified substrate management with adaptive layouts
 *
 * V3.0 Design Principles:
 * - Knowledge Blocks (factual) vs Meaning Blocks (interpretive)
 * - Adaptive layout based on basket maturity (0-10, 10-50, 50-150 blocks)
 * - Direct user control with inline actions
 * - Usage-based metrics (not stale/unused)
 * - No anchor concept exposed to users
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
  times_referenced: number;
  usefulness_score: number;
}

interface BuildingBlocksResponse {
  blocks: BlockWithMetrics[];
  stats: {
    total_blocks: number;
    knowledge_blocks: number;
    meaning_blocks: number;
  };
}

const fetcher = (url: string) => fetchWithToken(url).then((res) => {
  if (!res.ok) throw new Error('Failed to load knowledge base');
  return res.json();
});

// V3.0: Semantic types grouped by category
const KNOWLEDGE_TYPES = new Set(['fact', 'metric', 'entity']);
const MEANING_TYPES = new Set(['intent', 'objective', 'rationale', 'principle', 'assumption', 'context', 'constraint']);

type FilterMode = 'all' | 'knowledge' | 'meaning';
type ViewMode = 'expanded' | 'compact' | 'dense';

interface BuildingBlocksClientProps {
  basketId: string;
}

export default function BuildingBlocksClientV2({ basketId }: BuildingBlocksClientProps) {
  const { data, error, isLoading, mutate } = useSWR<BuildingBlocksResponse>(
    `/api/baskets/${basketId}/building-blocks`,
    fetcher,
    { refreshInterval: 60_000 },
  );

  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selected, setSelected] = useState<string | null>(null);

  // Adaptive view mode based on block count
  const viewMode: ViewMode = useMemo(() => {
    const total = data?.blocks?.length || 0;
    if (total <= 10) return 'expanded';
    if (total <= 50) return 'compact';
    return 'dense';
  }, [data?.blocks?.length]);

  // Filter blocks by category
  const { knowledgeBlocks, meaningBlocks } = useMemo(() => {
    if (!data?.blocks) return { knowledgeBlocks: [], meaningBlocks: [] };

    const knowledge = data.blocks.filter(b =>
      b.semantic_type && KNOWLEDGE_TYPES.has(b.semantic_type)
    );
    const meaning = data.blocks.filter(b =>
      b.semantic_type && MEANING_TYPES.has(b.semantic_type)
    );

    return { knowledgeBlocks: knowledge, meaningBlocks: meaning };
  }, [data?.blocks]);

  // Apply search and filter
  const filteredBlocks = useMemo(() => {
    let blocks: BlockWithMetrics[] = [];

    if (filterMode === 'knowledge') blocks = knowledgeBlocks;
    else if (filterMode === 'meaning') blocks = meaningBlocks;
    else blocks = data?.blocks || [];

    // Search filter
    if (query.trim()) {
      const q = query.toLowerCase();
      blocks = blocks.filter(b =>
        (b.title?.toLowerCase().includes(q)) ||
        (b.content?.toLowerCase().includes(q)) ||
        (b.semantic_type?.toLowerCase().includes(q))
      );
    }

    // Sort by usage
    return blocks.sort((a, b) => b.times_referenced - a.times_referenced);
  }, [data?.blocks, knowledgeBlocks, meaningBlocks, filterMode, query]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Blocks className="h-5 w-5 text-indigo-600" />
              Building Blocks
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Your knowledge organized into Knowledge and Meaning blocks
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
              Uploads
            </Link>
          </div>
        </CardHeader>

        {/* Stats */}
        <CardContent className="flex flex-wrap gap-3 border-t border-slate-100">
          <Badge variant="secondary" className="bg-slate-100 text-slate-700">
            {data?.stats.total_blocks || 0} total
          </Badge>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
            <Database className="h-3 w-3 mr-1" />
            {data?.stats.knowledge_blocks || 0} knowledge
          </Badge>
          <Badge variant="secondary" className="bg-purple-50 text-purple-700">
            <Brain className="h-3 w-3 mr-1" />
            {data?.stats.meaning_blocks || 0} meaning
          </Badge>
        </CardContent>
      </Card>

      {/* Filters & Search */}
      <Card>
        <CardContent className="space-y-4">
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
              variant={filterMode === 'knowledge' ? 'default' : 'outline'}
              onClick={() => setFilterMode('knowledge')}
            >
              <Database className="h-3 w-3 mr-1" />
              Knowledge
            </Button>
            <Button
              size="sm"
              variant={filterMode === 'meaning' ? 'default' : 'outline'}
              onClick={() => setFilterMode('meaning')}
            >
              <Brain className="h-3 w-3 mr-1" />
              Meaning
            </Button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              placeholder="Search blocks..."
            />
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

          {!isLoading && !error && (
            <>
              {/* Expanded View (0-10 blocks) - Cards fully clickable */}
              {viewMode === 'expanded' && (
                <div className="space-y-3">
                  {filteredBlocks.map(block => (
                    <Card
                      key={block.id}
                      className="border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer"
                      onClick={() => setSelected(block.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {block.title || 'Untitled block'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                              Used {block.times_referenced} times • Created {new Date(block.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {block.content && (
                          <p className="text-sm text-slate-600 bg-slate-50 rounded border border-slate-200 p-3 line-clamp-2">
                            {block.content}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {block.semantic_type && (
                            <Badge variant="outline" className="text-xs">
                              {block.semantic_type}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Compact View (10-50 blocks) - Cards fully clickable */}
              {viewMode === 'compact' && (
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredBlocks.map(block => (
                    <Card
                      key={block.id}
                      className="border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer"
                      onClick={() => setSelected(block.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900 truncate">
                              {block.title || 'Untitled'}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {block.times_referenced}× used
                            </p>
                          </div>
                        </div>
                        {block.semantic_type && (
                          <Badge variant="outline" className="text-xs">
                            {block.semantic_type}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Dense View (50-150 blocks) - Clickable rows */}
              {viewMode === 'dense' && (
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-slate-700">Title</th>
                        <th className="text-left px-3 py-2 font-medium text-slate-700">Type</th>
                        <th className="text-center px-3 py-2 font-medium text-slate-700">Usage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBlocks.map(block => (
                        <tr
                          key={block.id}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => setSelected(block.id)}
                        >
                          <td className="px-3 py-2">
                            <span className="font-medium text-slate-900">
                              {block.title || 'Untitled'}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="text-xs">
                              {block.semantic_type || '—'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-center text-slate-600">
                            {block.times_referenced}×
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredBlocks.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  No blocks found matching your search.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selected && (
        <SubstrateDetailModal
          open
          onClose={() => setSelected(null)}
          substrateType="block"
          substrateId={selected}
          basketId={basketId}
        />
      )}
    </div>
  );
}
