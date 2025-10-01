"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PenTool, RefreshCw, Sparkles } from 'lucide-react';
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
import { AnchorCard } from '@/components/anchors/AnchorCard';
import { AnchorCaptureDialog } from '@/components/anchors/AnchorCaptureDialog';
import { CreateAnchorDialog } from '@/components/anchors/CreateAnchorDialog';
import type { AnchorStatusSummary } from '@/lib/anchors/types';

interface Props {
  basketId: string;
  needsOnboarding?: boolean;
}

interface GovernanceDecisionNotice {
  route: string;
  reason?: string;
}

export default function MemoryClient({ basketId, needsOnboarding }: Props) {
  const router = useRouter();
  const [showAddMemory, setShowAddMemory] = useState(false);

  const [anchors, setAnchors] = useState<AnchorStatusSummary[]>([]);
  const [anchorsLoading, setAnchorsLoading] = useState(true);
  const [anchorError, setAnchorError] = useState<string | null>(null);
  const [anchorSubmitting, setAnchorSubmitting] = useState(false);
  const [selectedAnchor, setSelectedAnchor] = useState<AnchorStatusSummary | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [governanceNotice, setGovernanceNotice] = useState<GovernanceDecisionNotice | null>(null);

  const [reflections, setReflections] = useState<ReflectionDTO[]>([]);
  const [reflectionsLoading, setReflectionsLoading] = useState(true);
  const [reflectionsError, setReflectionsError] = useState<string | null>(null);

  const loadAnchors = useCallback(async () => {
    setAnchorsLoading(true);
    setAnchorError(null);
    try {
      const response = await fetchWithToken(`/api/baskets/${basketId}/anchors`);
      if (!response.ok) {
        throw new Error('Failed to load anchors');
      }
      const data = await response.json();
      setAnchors(data.anchors ?? []);
    } catch (error) {
      console.error('Anchor load failed', error);
      setAnchorError('Unable to load anchors');
    } finally {
      setAnchorsLoading(false);
    }
  }, [basketId]);

  const loadReflections = useCallback(async () => {
    try {
      setReflectionsLoading(true);
      setReflectionsError(null);

      const url = new URL(`/api/baskets/${basketId}/reflections`, window.location.origin);
      url.searchParams.set('limit', '5');

      const response = await fetchWithToken(url.toString());
      if (!response.ok) {
        throw new Error('Failed to load reflections');
      }

      const data: GetReflectionsResponse = await response.json();
      setReflections(data.reflections);
    } catch (err) {
      setReflectionsError(err instanceof Error ? err.message : 'Failed to load reflections');
    } finally {
      setReflectionsLoading(false);
    }
  }, [basketId]);

  useEffect(() => {
    loadAnchors();
  }, [loadAnchors]);

  useEffect(() => {
    loadReflections();
  }, [loadReflections]);

  useReflectionNotifications(basketId);

  const handleCapture = (anchor: AnchorStatusSummary) => {
    setSelectedAnchor(anchor);
    setCaptureOpen(true);
    setGovernanceNotice(null);
  };

  const handleCaptureSubmit = async (payload: { anchor_id: string; title?: string; content: string }) => {
    setAnchorSubmitting(true);
    try {
      const response = await fetchWithToken(`/api/baskets/${basketId}/anchors/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const { error, details } = await response.json().catch(() => ({}));
        throw new Error(error || details || 'Failed to save anchor');
      }

      const data = await response.json();
      if (data.anchors) {
        setAnchors(data.anchors);
      }
      if (data.decision) {
        setGovernanceNotice({ route: data.decision.route, reason: data.decision.reason });
      }
    } catch (error) {
      console.error('Anchor capture failed', error);
      setAnchorError(error instanceof Error ? error.message : 'Failed to save anchor');
    } finally {
      setAnchorSubmitting(false);
    }
  };

  const handleCreateAnchor = async (payload: { label: string; expected_type: 'block' | 'context_item'; description?: string }) => {
    setAnchorSubmitting(true);
    try {
      const response = await fetchWithToken(`/api/baskets/${basketId}/anchors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const { error, details } = await response.json().catch(() => ({}));
        throw new Error(error || details || 'Failed to create anchor');
      }

      const data = await response.json();
      if (data.anchors) {
        setAnchors(data.anchors);
      }
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Create anchor failed', error);
      setAnchorError(error instanceof Error ? error.message : 'Failed to create anchor');
    } finally {
      setAnchorSubmitting(false);
    }
  };

  const refreshDocuments = () => {
    try { router.refresh(); } catch (error) { console.warn('Refresh failed', error); }
  };

  const refreshReflections = async () => {
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

    setTimeout(loadReflections, 1000);
  };

  const groupedAnchors = useMemo(() => {
    const core = anchors.filter((anchor) => anchor.scope === 'core');
    const brain = anchors.filter((anchor) => anchor.scope === 'brain');
    const custom = anchors.filter((anchor) => anchor.scope === 'custom');
    return { core, brain, custom };
  }, [anchors]);

  return (
    <div className="space-y-6">
      <SubpageHeader
        title="Anchor Stewardship"
        basketId={basketId}
        description="Capture and maintain the canonical truths that power graphs, reflections, and deliverables."
        rightContent={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCreateDialogOpen(true)}
              variant="outline"
              size="sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              New anchor
            </Button>
            <Button
              onClick={() => setShowAddMemory(true)}
              variant="primary"
              size="sm"
            >
              <PenTool className="h-3.5 w-3.5" />
              Add thought
            </Button>
          </div>
        }
      />

      {needsOnboarding && (
        <OnboardingPanel basketId={basketId} onComplete={() => window.location.reload()} />
      )}

      {governanceNotice && governanceNotice.route === 'proposal' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-800">
            Anchor updates queued for governance review. You’ll be notified once the proposal is approved.
          </CardContent>
        </Card>
      )}

      {anchorError && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="p-4 text-sm text-rose-800">
            {anchorError}
          </CardContent>
        </Card>
      )}

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">Core anchors</h2>
          <p className="text-sm text-slate-500">Capture the foundational truths for this basket.</p>
        </div>
        {anchorsLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading anchors…</div>
        ) : groupedAnchors.core.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {groupedAnchors.core.map((anchor) => (
              <AnchorCard key={anchor.anchor_key} anchor={anchor} onCapture={handleCapture} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            Mode is missing core anchors. Check basket configuration.
          </div>
        )}
      </section>

      {groupedAnchors.brain.length > 0 && (
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Brain anchors</h2>
            <p className="text-sm text-slate-500">Mode-specific anchors tailored to this basket’s brain.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {groupedAnchors.brain.map((anchor) => (
              <AnchorCard key={anchor.anchor_key} anchor={anchor} onCapture={handleCapture} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">Custom anchors</h2>
          <p className="text-sm text-slate-500">Add basket-specific truths or workflows.</p>
        </div>
        {groupedAnchors.custom.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {groupedAnchors.custom.map((anchor) => (
              <AnchorCard key={anchor.anchor_key} anchor={anchor} onCapture={handleCapture} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No custom anchors yet. Create one to scaffold bespoke workflows.
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-600">Documents composed from your canon</p>
                <p className="text-xs text-slate-500">Keep documents aligned with anchor coverage</p>
              </div>
              <div className="flex items-center gap-2">
                <DocumentCreateButton basketId={basketId} />
                <Button onClick={refreshDocuments} variant="outline" size="sm">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </Button>
              </div>
            </div>
            <div className="mt-4">
              <DocumentsList limit={5} basketId={basketId} />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Latest reflections</h2>
          <Button onClick={refreshReflections} variant="ghost" size="sm">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh insights
          </Button>
        </div>
        <Card>
          <CardContent className="space-y-3 p-4">
            {reflectionsLoading && <p className="text-sm text-slate-500">Loading reflections…</p>}
            {reflectionsError && <p className="text-sm text-rose-600">{reflectionsError}</p>}
            {!reflectionsLoading && !reflections.length && (
              <p className="text-sm text-slate-500">No reflections yet. Capture anchors and knowledge to unlock reflections.</p>
            )}
            {reflections.map((reflection) => {
              const text = reflection.reflection_text;
              const preview = text.length > 220 ? `${text.slice(0, 217)}…` : text;
              const contextLabel = reflection.reflection_target_type === 'document'
                ? 'Document insight'
                : reflection.reflection_target_type === 'substrate'
                  ? 'Substrate insight'
                  : 'Legacy insight';
              return (
                <div key={reflection.id} className="rounded border border-slate-200 bg-white p-3 space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{contextLabel}</p>
                  <p className="text-sm text-slate-600">{preview}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <AnchorCaptureDialog
        open={captureOpen}
        anchor={selectedAnchor}
        submitting={anchorSubmitting}
        onSubmit={handleCaptureSubmit}
        onClose={() => setCaptureOpen(false)}
      />

      <CreateAnchorDialog
        open={createDialogOpen}
        submitting={anchorSubmitting}
        onSubmit={handleCreateAnchor}
        onClose={() => setCreateDialogOpen(false)}
      />

      <AddMemoryModal
        basketId={basketId}
        open={showAddMemory}
        onClose={() => setShowAddMemory(false)}
        onSuccess={() => {
          loadAnchors();
          loadReflections();
        }}
      />
    </div>
  );
}
