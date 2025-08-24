"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchWithToken } from "@/lib/fetchWithToken";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

interface AddMemoryComposerProps {
  basketId: string;
  disabled?: boolean;
  onSuccess?: (res: { dump_id: string }) => void;
}

export default function AddMemoryComposer({ basketId, disabled, onSuccess }: AddMemoryComposerProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!basketId) {
      router.replace("/memory");
      return;
    }
    const focusComposer = () => textareaRef.current?.focus();
    if (window.location.hash === "#add") {
      focusComposer();
    }
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "m") {
        e.preventDefault();
        focusComposer();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [basketId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !basketId || loading || disabled) return;
    setLoading(true);
    try {
      const res = await fetchWithToken("/api/dumps/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basket_id: basketId,
          text_dump: trimmed,
          dump_request_id: crypto.randomUUID(),
          meta: {
            client_ts: new Date().toISOString(),
            ingest_trace_id: crypto.randomUUID(),
          },
        }),
      });
      if (res.ok) {
        const dump = await res.json();
        onSuccess?.(dump);
        setText("");
      } else {
        console.error("Failed to create dump", await res.text());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a memory"
        rows={3}
        disabled={disabled || loading}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={disabled || loading || !text.trim()}>
          {loading ? "Adding..." : "Add memory"}
        </Button>
      </div>
    </form>
  );
}

