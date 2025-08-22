"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { createDump } from "@/lib/api/dumps";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

interface DumpBarContentProps {
  basketId: string;
  onSubmitted?: () => void;
  autoFocus?: boolean;
}

export function DumpBarContent({ basketId, onSubmitted, autoFocus }: DumpBarContentProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const storageKey = `dump-draft:${basketId}`;

  // Load draft from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) setText(stored);
  }, [storageKey]);

  // Persist draft
  useEffect(() => {
    localStorage.setItem(storageKey, text);
  }, [text, storageKey]);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => {
    autoGrow();
  }, [text]);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await createDump({ basketId, text });
      toast.success(
        (<span>
          Captured to Memory ✓
          <a className="ml-2 underline" href={`/baskets/${basketId}/timeline`}>View in Timeline</a>
        </span>),
      );
      setText("");
      await queryClient.invalidateQueries({ queryKey: ['timeline', basketId, 'all'] });
      await queryClient.invalidateQueries({ queryKey: ['memory:recent', basketId] });
      onSubmitted?.();
    } catch (e) {
      console.error(e);
      toast.error("Failed to capture");
    } finally {
      setSubmitting(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-2" aria-busy={submitting}>
      <Textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        onInput={autoGrow}
        placeholder="What just happened? Drop thoughts or files."
        rows={3}
        disabled={submitting}
      />
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>{text.length}</span>
        <Button onClick={handleSubmit} disabled={submitting || !text.trim()}>
          {submitting ? 'Capturing…' : 'Capture'}
        </Button>
      </div>
    </div>
  );
}

interface DumpBarPanelProps {
  basketId: string;
  onClose: () => void;
}

export default function DumpBarPanel({ basketId, onClose }: DumpBarPanelProps) {
  const panel = (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-2xl rounded-t-2xl bg-white p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <DumpBarContent basketId={basketId} onSubmitted={onClose} autoFocus />
      </div>
    </div>
  );
  return createPortal(panel, document.body);
}
