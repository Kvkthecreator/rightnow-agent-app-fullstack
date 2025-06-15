"use client";
import { useState } from "react";
import CommitTimeline from "@/components/timeline/CommitTimeline";
import BlocksWorkspace from "@/components/work/BlocksWorkspace";
import NarrativeView from "@/components/work/NarrativeView";
import { useInputs } from "@/lib/baskets/useInputs";

export default function BasketWorkPage({ params }: { params: { id: string } }) {
  const basketId = params.id;
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(null);
  const { data: inputs, isLoading, error } = useInputs(basketId);

  if (isLoading)
    return <div className="p-6 text-sm">Loading basket...</div>;
  if (error)
    return (
      <div className="p-6 text-sm text-red-500">
        Failed to load basket data.
      </div>
    );

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <CommitTimeline basketId={basketId} onSelect={setSelectedCommitId} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <NarrativeView input={inputs?.[0]} />
        <BlocksWorkspace
          basketId={basketId}
          highlightCommitId={selectedCommitId}
        />
      </div>
    </div>
  );
}
