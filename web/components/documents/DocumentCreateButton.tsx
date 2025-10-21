"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { notificationAPI } from '@/lib/api/notifications';

type TemplateOption = {
  id: string;
  name: string;
  description: string;
  defaultIntent: string;
  defaultTone?: string;
  defaultTitle?: string;
};

const templateOptions: TemplateOption[] = [
  {
    id: 'prompt_starter',
    name: 'Prompt Starter Pack',
    description: 'Generate the canonical copy-ready prompt for ambient agents.',
    defaultIntent: 'Summarize the basket so ambient agents can assist immediately.',
  },
  {
    id: 'strategy_brief',
    name: 'Strategy Brief',
    description: 'Highlight goals, tensions, and next moves from current memory.',
    defaultIntent: 'Create a strategy brief that explains where we are, risks, and top actions.',
    defaultTone: 'strategic'
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Tell Yarnnn what you need and it will compose from memory.',
    defaultIntent: '',
  }
];

export function DocumentCreateButton({ basketId, basketName }: { basketId: string; basketName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption | null>(null);
  const [intent, setIntent] = useState('');
  const [tone, setTone] = useState('');
  const [audience, setAudience] = useState('');
  const [creating, setCreating] = useState(false);

  const resetForm = () => {
    setSelectedTemplate(null);
    setIntent('');
    setTone('');
    setAudience('');
    setCreating(false);
  };

  const handleTemplateSelect = (template: TemplateOption) => {
    setSelectedTemplate(template);
    setIntent(template.defaultIntent || '');
    setTone(template.defaultTone || '');
  };

  const handleCreate = async () => {
    if (!selectedTemplate) return;
    setCreating(true);
    try {
      const templateTitle = selectedTemplate.defaultTitle
        || `${basketName} ${selectedTemplate.name}`;

      const submissionIntent = [intent || selectedTemplate.defaultIntent, audience && `Target audience: ${audience}`, tone && `Tone: ${tone}`]
        .filter(Boolean)
        .join('\n');

      const res = await fetch('/api/documents/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basket_id: basketId,
          title: templateTitle,
          intent: submissionIntent,
          template_id: selectedTemplate.id,
          target_audience: audience || undefined,
          tone: tone || undefined,
          window_days: 30,
          pinned_ids: [],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.document_id) {
        throw new Error(data?.error || 'Failed to create document');
      }

      await notificationAPI.emitJobStarted('document.compose', 'Document composition started', { basketId });
      router.push(`/baskets/${basketId}/documents/${data.document_id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create document';
      notificationAPI.emitActionResult('document.create', message, { severity: 'error' });
    } finally {
      setCreating(false);
      setOpen(false);
      resetForm();
    }
  };

  return (
    <div className="relative">
      <Button onClick={() => { setOpen(v => !v); resetForm(); }} size="sm" variant="outline">Create Document</Button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-20 p-4 space-y-4">
          {!selectedTemplate && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-800">What do you need?</div>
              {templateOptions.map(option => (
                <button
                  key={option.id}
                  className={itemCls('w-full text-left px-3 py-2 rounded border hover:bg-slate-50')}
                  onClick={() => handleTemplateSelect(option)}
                >
                  <div className="text-sm font-semibold text-slate-900">{option.name}</div>
                  <div className="text-xs text-slate-600">{option.description}</div>
                </button>
              ))}
            </div>
          )}

          {selectedTemplate && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-slate-800 flex items-center justify-between">
                <span>{selectedTemplate.name}</span>
                <button className="text-xs text-slate-500" onClick={resetForm}>Change</button>
              </div>
              <div className="text-xs text-slate-500">Basket: {basketName}</div>
              <textarea
                className="w-full border rounded p-2 text-sm"
                value={intent}
                placeholder="What should Yarnnn compose?"
                onChange={(e) => setIntent(e.target.value)}
              />
              <input
                className="w-full border rounded p-2 text-sm"
                value={audience}
                placeholder="Target audience (optional)"
                onChange={(e) => setAudience(e.target.value)}
              />
              <input
                className="w-full border rounded p-2 text-sm"
                value={tone}
                placeholder="Tone (optional, e.g. strategic, friendly)"
                onChange={(e) => setTone(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { resetForm(); setOpen(false); }}>Cancel</Button>
                <Button size="sm" onClick={handleCreate} disabled={creating}>
                  {creating ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function itemCls(...classes: string[]) {
  return cn(...classes);
}
