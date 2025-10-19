"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PenTool, RefreshCw, FileText, Boxes, Link as LinkIcon } from 'lucide-react';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { DocumentsList } from '@/components/documents/DocumentsList';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DocumentCreateButton } from '@/components/documents/DocumentCreateButton';
import AddMemoryModal from '@/components/memory/AddMemoryModal';
import OnboardingPanel from '@/components/memory/OnboardingPanel';
import InsightCanonCard from '@/components/insights/InsightCanonCard';
import InsightDetailModal from '@/components/insights/InsightDetailModal';
import EditableBasketTitle from '@/components/baskets/EditableBasketTitle';
import BasketMenu from '@/components/baskets/BasketMenu';
import type { BasketStats } from '@/app/api/baskets/[id]/stats/route';

interface Props {
  basketId: string;
  basketName: string;
  needsOnboarding?: boolean;
}

export default function MemoryClient({ basketId, basketName, needsOnboarding }: Props) {
  const router = useRouter();
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [showInsightModal, setShowInsightModal] = useState(false);

  const [stats, setStats] = useState<BasketStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

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

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refreshDocuments = () => {
    try { router.refresh(); } catch (error) { console.warn('Refresh failed', error); }
  };

  const handleRename = async (newName: string) => {
    const response = await fetchWithToken(`/api/baskets/${basketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });

    if (!response.ok) {
      throw new Error('Failed to rename basket');
    }

    router.refresh();
  };

  const handleArchive = async () => {
    const response = await fetchWithToken(`/api/baskets/${basketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    });

    if (!response.ok) {
      throw new Error('Failed to archive basket');
    }

    router.push('/baskets');
  };

  return (
    <div className="space-y-6">
      {/* Basket Header with Editable Title and Menu */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <EditableBasketTitle
              basketId={basketId}
              currentName={basketName}
              onUpdate={handleRename}
            />
            <BasketMenu
              basketId={basketId}
              basketName={basketName}
              onArchive={handleArchive}
            />
          </div>
          <p className="text-sm text-gray-600">Your basket's collective knowledge and latest insights.</p>
        </div>
        <Button
          onClick={() => setShowAddMemory(true)}
          variant="primary"
          size="sm"
          className="w-full sm:w-auto"
        >
          <PenTool className="h-3.5 w-3.5" />
          Add thought
        </Button>
      </div>

      {needsOnboarding && (
        <OnboardingPanel basketId={basketId} onComplete={() => window.location.reload()} />
      )}

      {/* Current Insight Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Current Insight</h2>
          <Button
            onClick={() => setShowInsightModal(true)}
            variant="ghost"
            size="sm"
            className="text-purple-600 hover:text-purple-700"
          >
            View Details
          </Button>
        </div>
        <div onClick={() => setShowInsightModal(true)} className="cursor-pointer">
          <InsightCanonCard basketId={basketId} compact={true} />
        </div>
      </section>

      {/* Dashboard-like metrics */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Knowledge overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Blocks */}
          <Card>
            <CardContent className="p-4 sm:p-5">
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

          {/* Relationships */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-50">
                    <LinkIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Relationships</span>
                </div>
                {!statsLoading && (
                  <span className="text-2xl font-semibold text-slate-900">
                    {stats?.relationships_count ?? 0}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Causal connections</p>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardContent className="p-4 sm:p-5">
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
            <DocumentCreateButton basketId={basketId} basketName={basketName} />
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
          // Refresh stats and documents after processing
          loadStats();
          refreshDocuments();
        }}
      />

      <InsightDetailModal
        basketId={basketId}
        open={showInsightModal}
        onClose={() => setShowInsightModal(false)}
      />
    </div>
  );
}
