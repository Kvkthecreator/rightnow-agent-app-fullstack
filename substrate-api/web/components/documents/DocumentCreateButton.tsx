"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { notificationAPI } from '@/lib/api/notifications';
import { X } from 'lucide-react';

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
  const [existingCanonical, setExistingCanonical] = useState<{id: string, title: string} | null>(null);
  const [checkingCanonical, setCheckingCanonical] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setSelectedTemplate(null);
    setIntent('');
    setTone('');
    setAudience('');
    setCreating(false);
  };

  const closeModal = () => {
    setOpen(false);
    resetForm();
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [open]);

  // Check for existing canonical brief when modal opens
  useEffect(() => {
    if (!open) return;

    const checkCanonicalBrief = async () => {
      setCheckingCanonical(true);
      try {
        const res = await fetch(`/api/baskets/${basketId}/documents?doc_type=document_canon`);
        if (res.ok) {
          const data = await res.json();
          if (data.documents && data.documents.length > 0) {
            setExistingCanonical({ id: data.documents[0].id, title: data.documents[0].title });
          }
        }
      } catch (error) {
        console.error('Failed to check for canonical brief:', error);
      } finally {
        setCheckingCanonical(false);
      }
    };

    checkCanonicalBrief();
  }, [open, basketId]);

  const handleTemplateSelect = (template: TemplateOption) => {
    // If trying to create canonical brief and one exists, redirect to existing
    if (template.id === 'prompt_starter' && existingCanonical) {
      router.push(`/baskets/${basketId}/documents/${existingCanonical.id}`);
      closeModal();
      return;
    }

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
          window_days: 90,
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
        <div ref={modalRef} className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-20 p-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-800">
              {selectedTemplate ? selectedTemplate.name : 'What do you need?'}
            </div>
            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          {!selectedTemplate && (
            <div className="space-y-2">
              {templateOptions.map(option => {
                const isCanonical = option.id === 'prompt_starter';
                const hasExisting = isCanonical && existingCanonical;

                return (
                  <button
                    key={option.id}
                    className={itemCls(
                      'w-full text-left px-3 py-2 rounded border hover:bg-slate-50',
                      hasExisting ? 'border-blue-200 bg-blue-50' : ''
                    )}
                    onClick={() => handleTemplateSelect(option)}
                  >
                    <div className="text-sm font-semibold text-slate-900">
                      {option.name}
                      {hasExisting && <span className="ml-2 text-xs font-normal text-blue-600">→ Open existing</span>}
                    </div>
                    <div className="text-xs text-slate-600">
                      {hasExisting
                        ? `"${existingCanonical.title}" already exists. Click to open.`
                        : option.description
                      }
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedTemplate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">Basket: {basketName}</div>
                <button className="text-xs text-slate-500 hover:text-slate-700" onClick={resetForm}>Change</button>
              </div>
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
