"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';

interface WorkItem {
  work_id: string;
  work_type: string;
  status: string;
  created_at: string;
  last_activity?: string;
  dump_id?: string | null;
}

interface ProposalItem {
  id: string;
  proposal_kind: string;
  status: string;
  created_at: string;
  impact_summary?: string;
}

interface TimelineEventItem {
  id: string | number;
  event_type: string;
  created_at: string;
  preview?: string | null;
}

export function useBasketNotifications(basketId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [work, setWork] = useState<WorkItem[]>([]);
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [events, setEvents] = useState<TimelineEventItem[]>([]);

  const storageKey = useMemo(() => basketId ? `y:last_seen:${basketId}` : null, [basketId]);
  const lastSeenTs = useMemo(() => (storageKey ? (localStorage.getItem(storageKey) || '') : ''), [storageKey]);

  const activeWork = useMemo(() => work.filter(w => ['pending','claimed','processing','cascading'].includes(w.status)), [work]);

  const unseenCount = useMemo(() => {
    if (!basketId) return 0;
    const since = lastSeenTs ? new Date(lastSeenTs).getTime() : 0;
    const newEvents = events.filter(e => new Date(e.created_at).getTime() > since).length;
    const needsAttention = activeWork.length > 0 ? 1 : 0;
    return newEvents + needsAttention;
  }, [basketId, events, activeWork.length, lastSeenTs]);

  const markSeen = useCallback(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, new Date().toISOString());
    } catch {}
  }, [storageKey]);

  const refresh = useCallback(async () => {
    if (!basketId) return;
    try {
      setLoading(true);
      setError(null);

      const [workRes, propRes, timeRes] = await Promise.all([
        fetch(`/api/baskets/${basketId}/work`),
        fetch(`/api/baskets/${basketId}/proposals?status=PROPOSED`),
        fetch(`/api/baskets/${basketId}/timeline?limit=20`),
      ]);

      if (workRes.ok) {
        const j = await workRes.json();
        setWork(j.items || []);
      }
      if (propRes.ok) {
        const j = await propRes.json();
        setProposals((j.items || []).map((p: any) => ({
          id: p.id,
          proposal_kind: p.proposal_kind,
          status: p.status,
          created_at: p.created_at,
          impact_summary: p.impact_summary,
        })));
      }
      if (timeRes.ok) {
        const j = await timeRes.json();
        setEvents((j.events || []).map((e: any) => ({
          id: e.id,
          event_type: e.event_type,
          created_at: e.created_at,
          preview: e.preview,
        })));
      }
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }, [basketId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    loading,
    error,
    work,
    activeWork,
    proposals,
    events,
    unseenCount,
    markSeen,
    refresh,
  };
}

