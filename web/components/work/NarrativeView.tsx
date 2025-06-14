"use client";
import { useSessionContext } from "@supabase/auth-helpers-react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "react-hot-toast";
import { createBlock } from "@/lib/supabase/blocks";
import { Button } from "@/components/ui/Button";
import { useInputs } from "@/lib/baskets/useInputs";
import { useBlocks } from "@/lib/baskets/useBlocks";
import { useHighlights } from "@/lib/baskets/useHighlights";

interface Props {
  basketId: string;
}

export default function NarrativeView({ basketId }: Props) {
  const { inputs, isLoading, error } = useInputs(basketId);
  const { session } = useSessionContext();
  const { blocks } = useBlocks(basketId);
  const { highlights } = useHighlights(basketId);

  const handlePromote = async () => {
    const sel = window.getSelection()?.toString().trim();
    if (!sel) return;
    if (!session?.user) return toast.error("Login required");
    await createBlock({
      user_id: session.user.id,
      type: "note",
      label: sel.split("\n")[0].slice(0, 120),
      content: sel,
    });
    toast.success("Promoted to block");
  };

  const highlightMap = React.useMemo(() => {
    const map = new Map<string, string>();
    highlights.forEach((h) => {
      const blk = blocks.find((b) => b.id === h.conflicting_block_id);
      if (blk) map.set(blk.label.toLowerCase(), `${h.reason}: ${blk.label}`);
    });
    return map;
  }, [highlights, blocks]);

  const renderers = {
    text({ children }: any) {
      const txt = String(children);
      for (const [label, tip] of highlightMap) {
        const idx = txt.toLowerCase().indexOf(label);
        if (idx !== -1) {
          return (
            <>
              {txt.slice(0, idx)}
                <span
                className="underline decoration-dotted decoration-yellow-600 underline-offset-2"
                title={tip}
                aria-label={tip}
              >
                {txt.slice(idx, idx + label.length)}
              </span>
              {txt.slice(idx + label.length)}
            </>
          );
        }
      }
      return <>{txt}</>;
    },
  } as any;

  if (isLoading) return <div className="p-6 text-sm">Loading…</div>;
  if (error) return <div className="p-6 text-sm text-red-500">Failed to load narrative.</div>;
  if (!inputs.length) return <div className="p-6 text-sm italic">No narrative yet.</div>;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <h2 className="sr-only">Narrative</h2>
      <Button
        onClick={handlePromote}
        size="sm"
        aria-label="Promote selected text"
        className="text-xs"
      >
        Promote Selection
      </Button>
      {inputs.map((i) => (
        <article key={i.id} className="prose max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
            {i.content}
          </ReactMarkdown>
        </article>
      ))}
    </div>
  );
}
