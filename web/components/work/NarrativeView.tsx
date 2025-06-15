"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type NarrativeViewProps = {
  input?: { content?: string };
};

export default function NarrativeView({ input }: NarrativeViewProps) {
  const content = input?.content;

  if (typeof content !== "string" || content.trim() === "") {
    return <p className="text-muted-foreground italic">No narrative available.</p>;
  }

  const rendered = useMemo(() => {
    try {
      return (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      );
    } catch (err) {
      console.error("Markdown render failed", err);
      return <p className="text-red-600">Failed to render narrative content.</p>;
    }
  }, [content]);

  return rendered;
}
