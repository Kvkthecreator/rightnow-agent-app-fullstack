"use client";
import { useCommits } from "@/lib/baskets/getCommits";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

interface Props {
  basketId: string;
  onSelect?: (commitId: string) => void;
}

export default function CommitTimeline({ basketId, onSelect }: Props) {
  const { commits, isLoading, error } = useCommits(basketId);

  if (isLoading) {
    return <aside className="p-4 w-52 text-sm text-muted-foreground">Loading…</aside>;
  }
  if (error) {
    return (
      <aside className="p-4 w-52 text-sm text-red-600">
        Failed to load commits
      </aside>
    );
  }
  return (
    <aside className="p-4 w-60 border-r bg-background/50 overflow-y-auto">
      <h3 className="text-xs uppercase mb-2 text-muted-foreground">Commits</h3>
      <ul className="space-y-1">
        {commits.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => onSelect?.(c.id)}
              className="w-full flex items-center gap-2 py-1 px-2 hover:bg-muted rounded-md text-left"
            >
              <span className="text-[10px] w-14 shrink-0">{dayjs(c.created_at).fromNow(true)}</span>
              <span className="flex-1 truncate">{c.summary || "Untitled dump"}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">
                +{c.new_blocks}
                {c.supersedes ? ` ⚠️${c.supersedes}` : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
