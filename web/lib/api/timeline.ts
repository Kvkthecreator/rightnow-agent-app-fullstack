export type TimelineItem = {
  id: number; basket_id: string; ts: string;
  kind: 'dump'|'reflection'|'narrative'|'system_note';
  ref_id?: string|null; preview?: string|null; payload?: any|null;
};

export async function fetchTimeline(
  basketId: string,
  opts: { before?: string; limit?: number; kind?: string[] } = {}
): Promise<{ items: TimelineItem[]; next_before: string|null }> {
  const params = new URLSearchParams();
  if (opts.before) params.set('before', opts.before);
  if (opts.limit) params.set('limit', String(opts.limit));
  (opts.kind ?? []).forEach(k => params.append('kind', k));
  const res = await fetch(`/api/baskets/${basketId}/timeline?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`timeline ${res.status}`);
  return res.json();
}
