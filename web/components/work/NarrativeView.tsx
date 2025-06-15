"use client";

import React from "react";
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

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
}
