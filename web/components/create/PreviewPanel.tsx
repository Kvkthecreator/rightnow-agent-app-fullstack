'use client';

import { AddedItem, CreateState } from './useCreatePageMachine';
import { ProgressRibbon } from './ProgressRibbon';

interface Props {
  intent: string;
  items: AddedItem[];
  state: CreateState;
  progress: number;
}

export function PreviewPanel({ intent, items, state, progress }: Props) {
  const titleSuggestion = intent || items[0]?.name || 'Proposed basket';
  const errorItems = items.filter((i) => i.status === 'error');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-1">Proposed basket</h3>
        <div className="border rounded p-2 text-sm" data-testid="title-suggestion">{titleSuggestion}</div>
      </div>
      <div>
        <h3 className="font-medium mb-1">Draft summary</h3>
        <div className="border rounded p-4 text-sm text-gray-500">We’ll auto-generate this after upload</div>
      </div>
      <div>
        <h3 className="font-medium mb-1">First insights</h3>
        <div className="border rounded p-4 text-sm text-gray-500">We’ll auto-generate this after upload</div>
      </div>
      <ProgressRibbon progress={progress} state={state} fileCount={items.filter(i=>i.kind==='file').length} />
      {errorItems.length > 0 && (
        <div className="text-sm text-yellow-600">⚠︎ {errorItems.length} item{errorItems.length>1?'s':''} needs attention</div>
      )}
    </div>
  );
}

