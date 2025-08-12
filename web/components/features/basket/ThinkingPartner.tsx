'use client';
import { useMemo, useState } from 'react';
import { requestId } from '@/lib/utils/id';
import { postBasketWork } from '@/lib/api/baskets';
import { useFocus } from './FocusContext';

type Suggestion = {
  label: string;
  intent: string;
  sources?: any[];
  agent_hints?: string[];
};

function useSuggestions(basketId: string) {
  const { focus } = useFocus();

  return useMemo<Suggestion[]>(() => {
    switch (focus.kind) {
      case 'document': {
        const sel = focus.selection ? `(${focus.selection.start},${focus.selection.end})` : '';
        return [
          { label: 'Summarize selection', intent: 'document_summarize_selection', agent_hints: ['document', `doc:${focus.id}`] },
          { label: 'Insert related blocks', intent: 'document_insert_related_blocks', agent_hints: ['document', `doc:${focus.id}`, 'blocks'] },
          { label: 'Rewrite for clarity', intent: 'document_rewrite_clarity', agent_hints: ['document', `doc:${focus.id}`] },
        ];
      }
      case 'block':
        return [
          { label: 'Promote block to doc', intent: 'compose_document_from_block', agent_hints: ['block', `block:${focus.id}`] },
          { label: 'Enrich block', intent: 'block_enrich', agent_hints: ['block', `block:${focus.id}`] },
        ];
      case 'context_item':
        return [
          { label: 'Gather related blocks', intent: 'collect_blocks_by_context', agent_hints: ['context_item', `ctx:${focus.id}`] },
          { label: 'Draft theme insight', intent: 'narrative_draft_theme', agent_hints: ['context_item', `ctx:${focus.id}`] },
        ];
      case 'dashboard':
      default:
        return [
          { label: 'Sift latest dumps into blocks', intent: 'sift_latest_dumps', agent_hints: ['ingest', 'blocks'] },
          { label: 'Draft plan from latest', intent: 'draft_plan_from_latest', agent_hints: ['plan'] },
          { label: 'Tag core topics', intent: 'tag_core_topics', agent_hints: ['context'] },
        ];
    }
  }, [focus, basketId]);
}

export default function ThinkingPartner({ basketId }:{ basketId:string }) {
  const suggestions = useSuggestions(basketId);
  const { focus } = useFocus();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (s: Suggestion) => {
    setError(null);
    setPending(s.intent);
    try {
      await postBasketWork(basketId, {
        request_id: requestId(),
        basket_id: basketId,
        intent: s.intent,
        sources: s.sources ?? [],
        agent_hints: s.agent_hints ?? [],
        user_context: { focus },
      });
      // polling will surface the proposed delta → right rail Change Review will update
    } catch (e:any) {
      setError(e?.message ?? 'Failed to propose change');
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="rounded border p-3 space-y-2">
      <div className="font-medium">Thinking Partner</div>
      <div className="text-xs text-muted-foreground">Adaptive to your current focus.</div>
      <div className="flex flex-col gap-2">
        {suggestions.map((s) => (
          <button
            key={s.intent}
            className="px-3 py-1 rounded border text-left disabled:opacity-60"
            onClick={() => run(s)}
            disabled={!!pending}
          >
            {pending === s.intent ? 'Working…' : s.label}
          </button>
        ))}
      </div>
      {error && <div className="text-xs text-red-500">{error}</div>}
    </div>
  );
}
