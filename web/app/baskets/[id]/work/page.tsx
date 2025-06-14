"use client";
import { useState } from "react";
import CommitTimeline from "@/components/timeline/CommitTimeline";
import BlocksWorkspace from "@/components/work/BlocksWorkspace";
import NarrativeView from "@/components/work/NarrativeView";
import { notFound } from "next/navigation";

export default function BasketWorkPage({ params }: any) {
  const basketId = params.id;
  if (!basketId) notFound();
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(null);

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <CommitTimeline basketId={basketId} onSelect={(id) => setSelectedCommitId(id)} />
      <NarrativeView basketId={basketId} />
      <BlocksWorkspace basketId={basketId} highlightCommitId={selectedCommitId} />
    </div>
  );
}
