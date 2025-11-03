"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { Lightbulb, RefreshCw, Clock } from 'lucide-react';
import { notificationAPI } from '@/lib/api/notifications';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface InsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
  currentVersionHash: string;
  basketId: string;
}

interface Insight {
  id: string;
  reflection_text: string;
  computation_timestamp: string;
  derived_from?: any;
}

export function InsightsModal({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  currentVersionHash,
  basketId,
}: InsightsModalProps) {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing insight for current version when modal opens
  useEffect(() => {
    if (!open) return;

    const fetchInsight = async () => {
      setLoading(true);
      setError(null);
      try {
        // Query for doc_insight that was derived from this document version
        const resp = await fetchWithToken(
          `/api/reflections/search?document_id=${documentId}&version_hash=${currentVersionHash}&insight_type=doc_insight`
        );

        if (resp.ok) {
          const data = await resp.json();
          if (data.insight) {
            setInsight(data.insight);
          } else {
            setInsight(null);
          }
        } else {
          // No insight found - this is okay, just means we need to generate
          setInsight(null);
        }
      } catch (err) {
        console.error('Failed to fetch insight:', err);
        // Non-fatal - just means no insight exists yet
        setInsight(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [open, documentId, currentVersionHash]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    await notificationAPI.emitJobStarted('document.reflection', `Analyzing "${documentTitle}"`, {
      basketId,
      correlationId: documentId,
    });

    try {
      const resp = await fetchWithToken('/api/p3/doc-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: documentId,
          force: true,
        }),
      });

      const payload = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(payload?.error || payload?.detail || 'Failed to generate insights');
      }

      await notificationAPI.emitJobSucceeded('document.reflection', 'Document insight generated', {
        basketId,
        correlationId: documentId,
      });

      // Refresh the insight display
      if (payload.reflection_id) {
        // Fetch the newly created insight
        const fetchResp = await fetchWithToken(`/api/reflections/${payload.reflection_id}`);
        if (fetchResp.ok) {
          const data = await fetchResp.json();
          setInsight(data);
        }
      }

      // Emit refresh event for other components
      window.dispatchEvent(new CustomEvent('reflections:refresh'));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate insights';
      setError(message);
      await notificationAPI.emitJobFailed('document.reflection', message, {
        basketId,
        correlationId: documentId,
      });
    } finally {
      setGenerating(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Document Insights
          </DialogTitle>
          <DialogDescription>
            AI-generated interpretation of this document's meaning and purpose
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 text-slate-400 animate-spin" />
              <span className="ml-3 text-sm text-slate-500">Loading insights...</span>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : insight ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                <span>Generated {formatTimestamp(insight.computation_timestamp)}</span>
              </div>
              <div className="prose prose-slate prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({children}) => <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-4">{children}</h1>,
                    h2: ({children}) => <h2 className="text-xl font-semibold text-slate-800 mt-5 mb-3">{children}</h2>,
                    h3: ({children}) => <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">{children}</h3>,
                    p: ({children}) => <p className="text-slate-700 leading-relaxed mb-4">{children}</p>,
                    ul: ({children}) => <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal list-inside space-y-2 text-slate-700 mb-4">{children}</ol>,
                    li: ({children}) => <li className="leading-relaxed">{children}</li>,
                    blockquote: ({children}) => (
                      <blockquote className="border-l-4 border-amber-400 bg-amber-50 pl-4 py-2 italic text-slate-600 my-4">
                        {children}
                      </blockquote>
                    ),
                    strong: ({children}) => <strong className="font-semibold text-slate-900">{children}</strong>,
                    em: ({children}) => <em className="italic text-slate-700">{children}</em>,
                    code: ({children}) => <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
                  }}
                >
                  {insight.reflection_text}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Lightbulb className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">No insights yet</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md">
                Generate AI insights to understand this document's meaning, purpose, and alignment with your basket context.
              </p>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Generate Insights
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {insight && !loading && (
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Insights
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
