"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TrustBanner from './TrustBanner';
import { EnhancedDocumentViewer } from './EnhancedDocumentViewer';
import { InsightsModal } from './InsightsModal';
import { notificationAPI } from '@/lib/api/notifications';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { ChevronLeft, Sparkles, ArrowUpRight, RefreshCw, FileText, Layers, History, Download, Lightbulb } from 'lucide-react';

interface DocumentRow {
  id: string;
  basket_id: string;
  workspace_id: string;
  title: string;
  content?: string | null; // Canon v3.0: content from current version
  metadata?: Record<string, any> | null;
  updated_at: string;
  created_at: string;
  source_raw_dump_id?: string | null; // Upload Wizard: link to original raw_dump
}

interface CompositionPayload {
  document: DocumentRow & { metadata: Record<string, any> };
  references: Array<{ reference: any; substrate: any }>;
  composition_stats: Record<string, any>;
}

interface DocumentPageProps {
  document: DocumentRow;
  basketId: string;
}

type ComposeState = 'idle' | 'running' | 'success' | 'failed';

const DEFAULT_WINDOW_DAYS = 30;
const POLL_INTERVAL_MS = 5000;

function formatDateTime(value?: string | null) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
}

function relativeTime(value?: string | null) {
  if (!value) return '–';
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(diff)) return '–';
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function DocumentPage({ document, basketId }: DocumentPageProps) {
  const router = useRouter();
  const [composition, setComposition] = useState<CompositionPayload | null>(null);
  const [references, setReferences] = useState<Array<{ reference: any; substrate: any }>>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false); // Server provides data, no loading needed
  const [error, setError] = useState<string | null>(null);
  const [composeState, setComposeState] = useState<ComposeState>('idle');
  const [composeMessage, setComposeMessage] = useState<string | null>(null);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeStartedAt, setComposeStartedAt] = useState<Date | null>(null);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);

  const fetchComposition = useCallback(async (silent = false): Promise<CompositionPayload | null> => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch(`/api/internal/documents/${document.id}/composition`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to load document composition');
      }
      const payload: CompositionPayload = await res.json();
      console.log('[DocumentPage] Composition payload:', {
        hasContent: !!payload?.document?.content,
        contentLength: payload?.document?.content?.length || 0,
        documentId: payload?.document?.id,
        referencesCount: payload?.references?.length || 0
      });
      setComposition(payload);
      setReferences(payload.references || []);
      return payload;
    } catch (err) {
      console.error(err);
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
      }
      return null;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [document.id]);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${document.id}/versions`, { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      setVersions(json.items || []);
    } catch (err) {
      console.debug('Versions fetch failed', err);
    }
  }, [document.id]);

  useEffect(() => {
    // Only fetch versions on mount - document content already provided by server
    fetchVersions();

    // Check if initial document has processing status
    if (document.metadata?.composition_status === 'processing' || document.metadata?.composition_status === 'recomposing') {
      setComposeState('running');
      setComposeMessage('Composition in progress');
    }
  }, [fetchVersions, document.metadata]);

  useEffect(() => {
    if (composeState !== 'running') return;
    let cancelled = false;
    const interval = setInterval(async () => {
      const payload = await fetchComposition(true);
      if (!payload || cancelled) return;
      const status = payload.document?.metadata?.composition_status;
      if (status === 'completed') {
        setComposeState('success');
        setComposeMessage('Document composed successfully');
        setComposeError(null);
        notificationAPI.emitJobSucceeded('document.compose', 'Document composed successfully', { basketId });
        clearInterval(interval);
      } else if (status === 'failed') {
        const errMessage = payload.document?.metadata?.composition_error || 'Composition failed';
        setComposeState('failed');
        setComposeError(errMessage);
        setComposeMessage(null);
        notificationAPI.emitJobFailed('document.compose', 'Document composition failed', { basketId, error: errMessage });
        clearInterval(interval);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [composeState, fetchComposition, basketId]);

  useEffect(() => {
    if (composeState === 'success' || composeState === 'failed') {
      const timeout = setTimeout(() => {
        setComposeState('idle');
        setComposeMessage(null);
        setComposeError(null);
      }, 6000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [composeState]);

  const metrics = useMemo(() => {
    const meta = composition?.document?.metadata?.phase1_metrics || composition?.document?.metadata?.composition_metrics;
    if (!meta) return null;
    return {
      coverage: meta.coverage_percentage ?? 0,
      freshness: meta.freshness_score ?? 0,
      provenance: meta.provenance_percentage ?? 0,
      processingMs: meta.processing_time_ms ?? 0,
      rawGaps: !!meta.raw_gaps_used,
    };
  }, [composition]);

  const structuredOutline = useMemo(() => {
    return (
      composition?.document?.metadata?.structured_outline ||
      document.metadata?.structured_outline ||
      null
    );
  }, [composition, document.metadata]);

  const substrateCount = references.length;
  const lastComposedAt = composition?.document?.metadata?.composition_completed_at;
  const hasVersions = versions.length > 0;

  const handleUpdateClick = () => {
    setShowUpdateConfirm(true);
  };

  const handleCompose = async () => {
    setShowUpdateConfirm(false);
    setComposeState('running');
    setComposeMessage('Composing from memory…');
    setComposeError(null);
    setComposeStartedAt(new Date());
    await notificationAPI.emitJobStarted('document.compose', `Composing "${document.title}"`, { basketId });
    try {
      const res = await fetch(`/api/documents/${document.id}/recompose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: document.metadata?.composition_intent || '', window_days: DEFAULT_WINDOW_DAYS })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to start composition');
      }
      setComposeMessage('Composition in progress…');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start composition';
      setComposeState('failed');
      setComposeMessage(null);
      setComposeError(message);
      notificationAPI.emitJobFailed('document.compose', 'Unable to start composition', { basketId, error: message });
    }
  };

  const handleExtractToMemory = async () => {
    const content = composition?.document?.content || document.content;
    if (!content) {
      notificationAPI.emitActionResult('document.extract', 'Document has no content to extract', { severity: 'warning' });
      return;
    }
    try {
      await notificationAPI.emitJobStarted('document.extract', 'Extracting document to memory');
      const dump_request_id = crypto.randomUUID();
      const res = await fetch('/api/dumps/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basket_id: basketId,
          dump_request_id,
          text_dump: `${composition?.document?.title || document.title}\n\n${content}`,
          meta: {
            source: 'document_extract',
            document_id: composition?.document?.id || document.id,
            document_title: composition?.document?.title || document.title,
            extraction_timestamp: new Date().toISOString()
          }
        })
      });
      if (!res.ok) throw new Error('Extract failed');
      await notificationAPI.emitJobSucceeded('document.extract', 'Captured extract as memory', { basketId });
      router.push(`/baskets/${basketId}/overview`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to extract to memory';
      await notificationAPI.emitJobFailed('document.extract', 'Extract failed', { basketId, error: message });
    }
  };

  const handleInsightsClick = () => {
    setShowInsightsModal(true);
  };

  const renderComposeBanner = () => {
    if (composeState === 'idle') return null;
    if (composeState === 'running') {
      const startedAgo = composeStartedAt ? relativeTime(composeStartedAt.toISOString()) : 'just now';
      return (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-700">Composing from memory…</p>
              <p className="text-xs text-blue-600">Our agents are retrieving substrate and drafting narrative. This typically takes a few moments.</p>
              <p className="mt-1 text-[11px] text-blue-500">Started {startedAgo}</p>
            </div>
          </div>
        </div>
      );
    }
    if (composeState === 'failed') {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-700">Composition failed</p>
              <p className="text-xs text-red-600">{composeError || 'Something prevented the composition from finishing.'}</p>
            </div>
          </div>
        </div>
      );
    }
    if (composeState === 'success') {
      return (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-700">Document composed successfully</p>
              <p className="text-xs text-green-600">{composeMessage || 'Fresh narrative available. Review the content below.'}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderReferences = () => {
    if (!references.length) {
      return (
        <Card className="p-4">
          <div className="text-sm text-slate-500">No blocks yet. Update document to attach sources from memory.</div>
        </Card>
      );
    }
    return (
      <Card className="p-0 overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Blocks
          </h3>
        </div>
        <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
          {references.map((entry, idx) => {
            const substrate = entry.substrate || {};
            const ref = entry.reference || {};
            const label = substrate.preview || substrate.title || 'Substrate source';
            const typeLabel = (substrate.substrate_type || ref.substrate_type || 'substrate').replace('_', ' ');
            return (
              <button
                key={ref.id || idx}
                onClick={() => router.push(`/baskets/${basketId}/building-blocks?highlight=${substrate.id || ''}&type=${substrate.substrate_type || 'block'}`)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="text-sm font-medium text-slate-800 truncate">{label}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 capitalize">{typeLabel}</Badge>
                  {ref.role && (
                    <Badge variant="outline" className="text-slate-600 border-slate-200">{ref.role}</Badge>
                  )}
                  {ref.weight ? <span>{Math.round(ref.weight * 100)}% weight</span> : null}
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    );
  };

  const renderVersions = () => {
    if (!versions.length) return null;
    return (
      <Card className="p-0 overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3 flex items-center gap-2">
          <History className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">Version History</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {versions.map((version) => (
            <div key={version.version_hash} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800">{version.version_message || 'Composed version'}</span>
                <span className="text-xs text-slate-500">{relativeTime(version.created_at)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <code className="bg-slate-100 px-1.5 py-0.5 rounded">{version.version_hash.slice(0, 12)}</code>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const renderStructuredOutline = () => {
    if (!structuredOutline) return null;
    const summary = structuredOutline.summary as string | undefined;
    const themes = (structuredOutline.themes as string[] | undefined) || [];
    const tensions = structuredOutline.tensions as Array<{ description?: string; impact?: string }> | undefined;
    const actions = structuredOutline.recommended_actions as Array<{ description?: string; urgency?: string }> | undefined;

    return (
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
          <Sparkles className="h-4 w-4" /> Outline Snapshot
        </div>
        {summary && <p className="text-sm text-slate-700">{summary}</p>}
        {!!themes.length && (
          <div>
            <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-1">Themes</h4>
            <ul className="list-disc list-inside text-sm text-slate-700">
              {themes.slice(0, 5).map(theme => (
                <li key={theme}>{theme}</li>
              ))}
            </ul>
          </div>
        )}
        {!!tensions?.length && (
          <div>
            <h4 className="text-xs uppercase tracking-wide text-amber-600 mb-1">Tensions</h4>
            <ul className="list-disc list-inside text-sm text-amber-800">
              {tensions.slice(0, 5).map((tension, idx) => (
                <li key={idx}>{tension.description}{tension.impact ? ` — ${tension.impact}` : ''}</li>
              ))}
            </ul>
          </div>
        )}
        {!!actions?.length && (
          <div>
            <h4 className="text-xs uppercase tracking-wide text-emerald-600 mb-1">Recommended Actions</h4>
            <ul className="list-disc list-inside text-sm text-emerald-800">
              {actions.slice(0, 5).map((action, idx) => (
                <li key={idx}>{action.description}{action.urgency ? ` (${action.urgency})` : ''}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    );
  };

  const renderMetricsCard = () => {
    if (!metrics && substrateCount === 0) return null;

    return (
      <Card className="p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Composition Metrics
          </h3>
          <div className="mt-2 text-xs text-slate-500">
            Last composed {lastComposedAt ? formatDateTime(lastComposedAt) : 'Not yet composed'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
            {substrateCount} substrate inputs
          </Badge>
          <Badge variant="secondary" className="bg-green-50 text-green-700">
            Coverage {metrics ? Math.round(metrics.coverage * 100) : 0}%
          </Badge>
          <Badge variant="secondary" className="bg-violet-50 text-violet-700">
            Freshness {metrics ? Math.round(metrics.freshness * 100) : 0}%
          </Badge>
          <Badge variant="secondary" className="bg-amber-50 text-amber-700">
            Provenance {metrics ? Math.round(metrics.provenance * 100) : 0}%
          </Badge>
        </div>
      </Card>
    );
  };

  const currentContent = composition?.document?.content || document.content || '';

  // Debug: Log content state
  useEffect(() => {
    console.log('[DocumentPage] Content state:', {
      hasComposition: !!composition,
      compositionContent: composition?.document?.content?.substring(0, 100),
      documentContent: document.content?.substring(0, 100),
      currentContentLength: currentContent.length,
      hasCurrentContent: !!currentContent
    });
  }, [composition, document.content, currentContent]);

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <button onClick={() => router.push(`/baskets/${basketId}/documents`)} className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition">
                <ChevronLeft className="h-4 w-4" />
                Documents
              </button>
              <span className="text-slate-300">/</span>
              <span>{composition?.document?.title || document.title}</span>
            </div>
            <h1 className="text-3xl font-semibold text-slate-900 leading-tight">
              {composition?.document?.title || document.title}
            </h1>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span>Last updated {relativeTime(composition?.document?.updated_at || document.updated_at)}</span>
              <span>{substrateCount} {substrateCount === 1 ? 'block' : 'blocks'}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {document.source_raw_dump_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/baskets/${basketId}/timeline?view=uploads&highlight=${document.source_raw_dump_id}`)}
              >
                <FileText className="mr-2 h-4 w-4" />
                View Original Upload
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleInsightsClick}>
              <Lightbulb className="mr-2 h-4 w-4" />
              Insights
            </Button>
            <Button variant="default" size="sm" onClick={handleUpdateClick} disabled={composeState === 'running'}>
              <Sparkles className="mr-2 h-4 w-4" />
              {composeState === 'running' ? 'Updating…' : 'Update'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExtractToMemory} disabled={composeState === 'running'}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        {metrics && (
          <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
            <TrustBanner
              provenance_percentage={metrics.provenance}
              freshness_score={metrics.freshness}
              coverage_percentage={metrics.coverage}
              raw_gaps_used={metrics.rawGaps}
              processing_time_ms={metrics.processingMs}
              substrate_count={substrateCount}
            />
          </div>
        )}
      </header>

      {renderComposeBanner()}
      {composeMessage && composeState === 'running' && (
        <p className="text-xs text-blue-600">{composeMessage}</p>
      )}
      {composeError && composeState === 'failed' && (
        <p className="text-xs text-red-600">{composeError}</p>
      )}

      <div className="flex flex-col gap-6">
          <Card className="p-0 overflow-hidden">
            {loading ? (
              <div className="p-6 text-sm text-slate-500">Loading document…</div>
            ) : error ? (
              <div className="p-6 text-sm text-red-600">{error}</div>
            ) : currentContent ? (
              <div className="p-6">
                <EnhancedDocumentViewer
                  content={currentContent}
                  references={references.map(entry => ({
                    id: entry.substrate?.id || entry.reference?.id,
                    substrate_type: entry.substrate?.substrate_type || entry.reference?.substrate_type,
                    preview: entry.substrate?.preview || entry.substrate?.title,
                    title: entry.substrate?.title,
                    role: entry.reference?.role,
                    weight: entry.reference?.weight
                  }))}
                />
              </div>
            ) : (
              <div className="p-12 text-center text-sm text-slate-500">
                No content yet. Click "Update" to compose document from your memory.
              </div>
            )}
          </Card>

          {renderMetricsCard()}
          {renderStructuredOutline()}

          <div className={`grid gap-6 ${hasVersions ? 'lg:grid-cols-2' : ''}`}>
            <div className="flex flex-col gap-6">
              {renderReferences()}
            </div>
            {hasVersions && (
              <div className="flex flex-col gap-6">{renderVersions()}</div>
            )}
          </div>
        </div>

      <Dialog open={showUpdateConfirm} onOpenChange={setShowUpdateConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Document?</DialogTitle>
            <DialogDescription>
              This will recompose the document using the latest blocks from your memory. This may take a few moments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateConfirm(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleCompose}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InsightsModal
        open={showInsightsModal}
        onOpenChange={setShowInsightsModal}
        documentId={document.id}
        documentTitle={composition?.document?.title || document.title}
        currentVersionHash={(composition?.document as any)?.current_version_hash || ''}
        basketId={basketId}
      />
    </div>
  );
}
