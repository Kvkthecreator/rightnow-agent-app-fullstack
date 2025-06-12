"use client";
import { useState } from "react";
import CommitTimeline from "@/components/timeline/CommitTimeline";
import BlocksWorkspace from "@/components/work/BlocksWorkspace";
import { notFound } from "next/navigation";

export default function BasketWorkPage({ params }: any) {
  const basketId = params.id;
  if (!basketId) notFound();
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(null);

  return (
    <div className="flex h-screen">
      <CommitTimeline basketId={basketId} onSelect={(id) => setSelectedCommitId(id)} />
      <BlocksWorkspace basketId={basketId} highlightCommitId={selectedCommitId} />
    </div>
  );
}
