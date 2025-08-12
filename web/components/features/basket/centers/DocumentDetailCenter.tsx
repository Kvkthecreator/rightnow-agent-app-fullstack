'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useBasketDeltas } from '../hooks';
import { useFocus } from '../FocusContext';

export default function DocumentDetailCenter({ basketId, docId }:{ basketId:string; docId:string }) {
  const { data: deltas } = useBasketDeltas(basketId);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const { setFocus } = useFocus();
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    setFocus({ kind: 'document', id: docId });
  }, [docId, setFocus]);

  const onSelect = () => {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    setFocus({ kind: 'document', id: docId, selection: { start, end } });
  };

  const latestDocDelta = useMemo(() => {
    if (!deltas?.length) return null;
    for (const d of deltas) {
      const arr = Array.isArray(d.changes) ? d.changes : [];
      const hit = arr.find((c:any) => c?.entity === 'document' && (c?.id === docId));
      if (hit) return { delta: d, change: hit };
    }
    return null;
  }, [deltas, docId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Document</div>
        <div className="text-xs text-muted-foreground">Doc ID: {docId.slice(0,8)}…</div>
      </div>

      {latestDocDelta && (
        <div className="rounded border p-3 bg-amber-50/50">
          <div className="font-medium">Proposed change detected</div>
          <div className="text-xs text-muted-foreground">
            {new Date(latestDocDelta.delta.created_at).toLocaleString()}
          </div>
          <div className="text-sm mt-2">
            {typeof latestDocDelta.change?.diff === 'string'
              ? <pre className="text-xs whitespace-pre-wrap">{latestDocDelta.change.diff}</pre>
              : <span>{latestDocDelta.delta.summary ?? 'Proposed update to this document.'}</span>}
          </div>
        </div>
      )}

      <div className="rounded border p-2">
        <textarea
          ref={editorRef}
          value={content}
          onChange={(e)=>setContent(e.target.value)}
          onSelect={onSelect}
          placeholder="Start writing… select text to get context-aware suggestions in the right rail."
          className="w-full h-[60vh] p-3 text-sm outline-none"
        />
      </div>
    </div>
  );
}
