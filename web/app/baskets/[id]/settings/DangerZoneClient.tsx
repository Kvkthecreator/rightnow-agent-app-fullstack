"use client";

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Props {
  basketId: string;
  basketName: string;
}

type Mode = 'archive_all' | 'redact_dumps' | 'hard_purge';

export default function DangerZoneClient({ basketId, basketName }: Props) {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<{ blocks: number; context_items: number; dumps: number } | null>(null);
  const [mode, setMode] = useState<Mode>('archive_all');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/baskets/${basketId}/purge/preview`, { cache: 'no-store' });
        if (res.ok) {
          setCounts(await res.json());
        } else {
          setCounts(null);
        }
      } catch {
        setCounts(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [basketId]);

  const disabled = useMemo(() => {
    if (mode === 'hard_purge') return true; // hidden admin only in future; disabled for now
    return confirm !== basketName;
  }, [mode, confirm, basketName]);

  const run = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch(`/api/baskets/${basketId}/purge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, confirmation_text: confirm })
      });
      const json = await res.json();
      setResult(json);
      if (res.ok) {
        // refresh counts
        const pv = await fetch(`/api/baskets/${basketId}/purge/preview`, { cache: 'no-store' });
        if (pv.ok) setCounts(await pv.json());
      }
    } catch (e) {
      setResult({ error: 'Network error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {loading ? (
            <div className="text-muted-foreground">Loading…</div>
          ) : counts ? (
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">Blocks {counts.blocks}</Badge>
              <Badge variant="outline">Context Items {counts.context_items}</Badge>
              <Badge variant="outline">Dumps {counts.dumps}</Badge>
              <div className="text-muted-foreground">
                Retention: blocks/context items 30 days; dumps 90 days (developer‑managed)
              </div>
            </div>
          ) : (
            <div className="text-red-600">Failed to load counts</div>
          )}
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="mode" checked={mode==='archive_all'} onChange={() => setMode('archive_all')} />
              <span>Archive + Redact All</span>
            </label>
            <div className="pl-6 text-xs text-muted-foreground">Archives meaning (blocks/context) and redacts original notes. Safest, reversible (except redaction content).</div>

            <label className="flex items-center gap-2 text-sm mt-2">
              <input type="radio" name="mode" checked={mode==='redact_dumps'} onChange={() => setMode('redact_dumps')} />
              <span>Redact Dumps Only</span>
            </label>
            <div className="pl-6 text-xs text-muted-foreground">Removes original note content only. Leaves meaning intact.</div>

            <label className="flex items-center gap-2 text-sm mt-2 opacity-50">
              <input type="radio" name="mode" disabled checked={mode==='hard_purge'} onChange={() => setMode('hard_purge')} />
              <span>Hard Purge (Admin)</span>
            </label>
            <div className="pl-6 text-xs text-muted-foreground">Requires retention policy and admin approval; deletes later via scheduled vacuum.</div>
          </div>

          <div className="pt-2">
            <div className="text-sm font-medium">Type the basket name to confirm</div>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={basketName}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={run} disabled={disabled || submitting} className="bg-red-600 hover:bg-red-700 text-white">
              {submitting ? 'Working…' : mode==='redact_dumps' ? 'Redact Dumps' : 'Archive + Redact All'}
            </Button>
            {result && (
              <div className="text-xs text-muted-foreground">
                {result.error ? (
                  <span className="text-red-600">{result.error}</span>
                ) : (
                  <span>Executed: {result.executed_batches || 0} batches, ops {result.total_operations || 0}</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

