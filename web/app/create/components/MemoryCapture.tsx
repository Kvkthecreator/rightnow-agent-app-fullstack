'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { SubstrateEvolution } from './SubstrateEvolution';
import { IntentField } from './IntentField';
import UnifiedIngest from './UnifiedIngest';
import type { IngestItem } from './UnifiedIngest';
import { Button } from '@/components/ui/Button';
import { uploadFile } from '@/lib/uploadFile';
import { sanitizeFilename } from '@/lib/utils/sanitizeFilename';

export interface SourceInput {
  type: 'file' | 'text';
  content?: string;
  id?: string;
  name?: string;
  size?: number;
}

interface Props {
  onFormation: (intent: string, inputs: SourceInput[]) => void;
  basketId: string | null;
}

export function MemoryCapture({ onFormation, basketId }: Props) {
  const [intent, setIntent] = useState('');
  const [items, setItems] = useState<IngestItem[]>([]);
  const [isForming, setIsForming] = useState(false);

  const handleCreate = async () => {
    // Prevent multiple submissions
    if (isForming) return;
    
    setIsForming(true);
    
    try {
      const sources: SourceInput[] = await Promise.all(
        items.map(async (item) => {
          if (item.kind === 'file') {
            const sanitizedName = sanitizeFilename(item.file.name);
            const url = await uploadFile(item.file, `ingest/${sanitizedName}`);
            return { type: 'file', id: url, name: item.file.name, size: item.file.size };
          }
          if (item.kind === 'url') {
            return { type: 'text', content: item.url, name: item.url };
          }
          return { type: 'text', content: item.text };
        })
      );
      
      await onFormation(intent, sources);
    } catch (error) {
      console.error('❌ Memory formation failed:', error);
      // Reset loading state on error so user can retry
      setIsForming(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <IntentField value={intent} onChange={setIntent} />

      {!isForming && <UnifiedIngest onChange={setItems} />}
      {isForming && basketId && <SubstrateEvolution basketId={basketId} />}

      {!isForming && items.length > 0 && intent && (
        <Button size="lg" className="w-full flex items-center justify-center gap-2" onClick={handleCreate}>
          <Sparkles size={20} />
          Begin Formation
        </Button>
      )}
      
      {isForming && (
        <div className="text-center">
          <Button size="lg" className="w-full" disabled>
            Creating Basket...
          </Button>
        </div>
      )}
    </div>
  );
}
