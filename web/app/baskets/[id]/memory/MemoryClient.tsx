"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PenTool, RefreshCw, FileText, Boxes, Link as LinkIcon } from 'lucide-react';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { DocumentsList } from '@/components/documents/DocumentsList';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SubpageHeader } from '@/components/basket/SubpageHeader';
import { DocumentCreateButton } from '@/components/documents/DocumentCreateButton';
import AddMemoryModal from '@/components/memory/AddMemoryModal';
import OnboardingPanel from '@/components/memory/OnboardingPanel';
import { useReflectionNotifications } from '@/lib/hooks/useReflectionNotifications';
import type { GetReflectionsResponse, ReflectionDTO } from '@/shared/contracts/reflections';
import type { BasketStats } from '@/app/api/baskets/[id]/stats/route';

interface Props {
  basketId: string;
  needsOnboarding?: boolean;
}

export default function MemoryClient({ basketId, needsOnboarding }: Props) {
  const router = useRouter();
  const [showAddMemory, setShowAddMemory] = useState(false);

  const [stats, setStats] = useState<BasketStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [latestReflection, setLatestReflection] = useState<ReflectionDTO | null>(null);
  const [reflectionLoading, setReflectionLoading] = useState(true);
  const [reflectionError, setReflectionError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await fetchWithToken(`/api/baskets/${basketId}/stats`);
      if (!response.ok) throw new Error('Failed to load stats');
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Stats load failed', error);
    } finally {
      setStatsLoading(false);
    }
  }, [basketId]);

  const loadLatestReflection = useCallback(async () => {
    try {
      setReflectionLoading(true);
      setReflectionError(null);

      const url = new URL(`/api/baskets/${basketId}/reflections`, window.location.origin);
      url.searchParams.set('limit', '1');

      const response = await fetchWithToken(url.toString());
      if (!response.ok) {
        throw new Error('Failed to load reflection');
      }

      const data: GetReflectionsResponse = await response.json();
      setLatestReflection(data.reflections[0] || null);
    } catch (err) {
      setReflectionError(err instanceof Error ? err.message : 'Failed to load reflection');
    } finally {
      setReflectionLoading(false);
    }
  }, [basketId]);

  useEffect(() => {
    loadStats();
    loadLatestReflection();
  }, [loadStats, loadLatestReflection]);

  useReflectionNotifications(basketId);

  const refreshDocuments = () => {
    try { router.refresh(); } catch (error) { console.warn('Refresh failed', error); }
  };

  const refreshReflection = async () => {
    try {
      await fetchWithToken('/api/reflections/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basket_id: basketId,
          force_refresh: true,
          scope: 'window',
          substrate_window_hours: 24 * 7,
        }),
      });
    } catch (err) {
      console.error('Failed to trigger reflection refresh:', err);
    }

    setTimeout(loadLatestReflection, 1000);
  };

  return (
    <div className="space-y-6">
      <SubpageHeader
        title="Memory"
        basketId={basketId}
        description="Your basket's collective knowledge and latest insights."
        rightContent={
          <Button
            onClick={() => setShowAddMemory(true)}
            variant="primary"
            size="sm"
          >
            <PenTool className="h-3.5 w-3.5" />
            Add thought
          </Button>
        }
      />

      {needsOnboarding && (
        <OnboardingPanel basketId={basketId} onComplete={() => window.location.reload()} />
      )}

      {/* Latest Insight - Basket-level reflection */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Latest insight</h2>
          <Button onClick={refreshReflection} variant="ghost" size="sm">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            {reflectionLoading && (
              <p className="text-sm text-slate-500">Loading latest insight…</p>
            )}
            {reflectionError && (
              <p className="text-sm text-rose-600">{reflectionError}</p>
            )}
            {!reflectionLoading && !latestReflection && (
              <div className="text-center py-6">
                <p className="text-sm text-slate-500 mb-2">No reflections yet.</p>
                <p className="text-xs text-slate-400">Add knowledge to your basket to unlock AI-generated insights.</p>
              </div>
            )}
            {latestReflection && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {latestReflection.reflection_target_type === 'document'
                      ? 'Document insight'
                      : latestReflection.reflection_target_type === 'substrate'
                        ? 'Substrate insight'
                        : 'Basket insight'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(latestReflection.computation_timestamp).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {latestReflection.reflection_text}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Dashboard-like metrics */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Knowledge overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Blocks */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Boxes className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Blocks</span>
                </div>
                {!statsLoading && (
                  <span className="text-2xl font-semibold text-slate-900">
                    {stats?.blocks_count ?? 0}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Structured knowledge pieces</p>
            </CardContent>
          </Card>

          {/* Context Items */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-50">
                    <LinkIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Links</span>
                </div>
                {!statsLoading && (
                  <span className="text-2xl font-semibold text-slate-900">
                    {stats?.context_items_count ?? 0}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Connections and tags</p>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-50">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Documents</span>
                </div>
                {!statsLoading && (
                  <span className="text-2xl font-semibold text-slate-900">
                    {stats?.documents_count ?? 0}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Composed narratives</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Documents list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Documents</h2>
          <div className="flex items-center gap-2">
            <DocumentCreateButton basketId={basketId} />
            <Button onClick={refreshDocuments} variant="outline" size="sm">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>
        <Card>
          <CardContent className="p-4">
            <DocumentsList limit={10} basketId={basketId} />
          </CardContent>
        </Card>
      </section>

      <AddMemoryModal
        basketId={basketId}
        open={showAddMemory}
        onClose={() => setShowAddMemory(false)}
        onSuccess={() => {
          loadStats();
          loadLatestReflection();
        }}
      />
    </div>
  );
}
