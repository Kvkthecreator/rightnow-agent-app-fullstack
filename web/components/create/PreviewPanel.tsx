'use client';

import { useState } from 'react';
import { AddedItem, CreateState } from './useCreatePageMachine';
import { ProgressRibbon } from './ProgressRibbon';

interface Props {
  intent: string;
  items: AddedItem[];
  state: CreateState;
  progress: number;
  error?: string | null;
}

export function PreviewPanel({ intent, items, state, progress, error }: Props) {
  const titleSuggestion = intent || items[0]?.name || 'Proposed basket';
  const errorItems = items.filter((i) => i.status === 'error');
  const [showDebug, setShowDebug] = useState(false);
  const [debugLog, setDebugLog] = useState('');

  const loadDebug = () => {
    if (!showDebug) {
      const log = localStorage.getItem('create:lastRun') || '';
      setDebugLog(log);
    }
    setShowDebug(!showDebug);
  };

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
      {error && (
        <div className="text-sm text-red-600 whitespace-pre-wrap">{error}</div>
      )}
      <button
        className="text-xs text-blue-500 hover:underline"
        onClick={loadDebug}
      >
        {showDebug ? 'Hide' : 'Show'} debug details
      </button>
      {showDebug && (
        <pre className="text-xs whitespace-pre-wrap break-all">{debugLog}</pre>
      )}
    </div>
  );
}

