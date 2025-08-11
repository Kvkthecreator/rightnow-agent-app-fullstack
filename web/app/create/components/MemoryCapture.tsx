'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { SubstrateEvolution } from './SubstrateEvolution';
import { IntentField } from './IntentField';
import UnifiedIngest, { IngestItem } from './UnifiedIngest';
import { Button } from '@/components/ui/Button';

export interface Input {
  type: 'file' | 'text' | 'url';
  name?: string;
  content: string;
  size?: number;
}

interface Props {
  onFormation: (intent: string, inputs: Input[]) => void;
  basketId: string | null;
}

export function MemoryCapture({ onFormation, basketId }: Props) {
  const [intent, setIntent] = useState('');
  const [items, setItems] = useState<IngestItem[]>([]);
  const [isForming, setIsForming] = useState(false);

  const handleCreate = async () => {
    setIsForming(true);
    const inputs: Input[] = await Promise.all(
      items.map(async (it) => {
        if (it.kind === 'file') {
          const content = await it.file.text();
          return { type: 'file', name: it.file.name, content, size: it.file.size };
        }
        if (it.kind === 'text') {
          return { type: 'text', content: it.text };
        }
        return { type: 'url', content: it.url, name: it.url };
      })
    );
    onFormation(intent, inputs);
  };

  return (
    <div className="container py-10 space-y-8">
      <IntentField value={intent} onChange={setIntent} />

      {!isForming && <UnifiedIngest onChange={setItems} />}

      {isForming && basketId && <SubstrateEvolution basketId={basketId} />}

      {!isForming && items.length > 0 && intent && (
        <Button size="lg" className="w-full" onClick={handleCreate}>
          <Sparkles size={20} />
          Begin Formation
        </Button>
      )}
    </div>
  );
}

