"use client";
import BlocksList from "./BlocksList";
import { usePendingChanges } from "@/lib/baskets/usePendingChanges";

interface Props {
  basketId: string;
  highlightCommitId?: string | null;
}

export default function BlocksWorkspace({ basketId, highlightCommitId }: Props) {
  const pending = usePendingChanges(basketId);

  return (
    <section className="flex-1 flex flex-col overflow-hidden">
      <header className="h-10 px-6 flex items-center border-b">
        {pending > 0 && (
          <button
            onClick={() => alert("Change queue coming soon")}
            className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md"
          >
            ⚠︎ {pending} change{pending > 1 ? "s" : ""}
          </button>
        )}
      </header>
      <BlocksList basketId={basketId} highlightCommitId={highlightCommitId} />
    </section>
  );
}
