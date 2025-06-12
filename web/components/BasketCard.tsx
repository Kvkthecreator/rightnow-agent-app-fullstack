"use client";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";

export interface BasketCardProps {
  basket: {
    id: string;
    intent_summary?: string | null;
    raw_dump?: string | null;
    updated_at?: string | null;
    created_at?: string | null;
    blocks_count?: number | null;
  };
}

export default function BasketCard({ basket }: BasketCardProps) {
  const router = useRouter();
  const updated = basket.updated_at
    ? formatDistanceToNow(new Date(basket.updated_at), { addSuffix: true })
    : "";
  const created = basket.created_at
    ? format(new Date(basket.created_at), "PPP")
    : "";
  const preview = basket.raw_dump?.slice(0, 150) || "No dump yet. Add something?";
  return (
    <div
      className="rounded-md border p-4 hover:bg-muted cursor-pointer"
      onClick={() => router.push(`/baskets/${basket.id}/work`)}
    >
      <div className="flex justify-between">
        <h3 className="text-md font-semibold truncate">
          🧺 {basket.intent_summary || "Untitled Basket"}
        </h3>
        {updated && (
          <span className="text-xs text-muted-foreground">Updated {updated}</span>
        )}
      </div>
      {preview && (
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {preview}
        </p>
      )}
      <div className="text-xs mt-2 text-muted-foreground">
        {basket.blocks_count ?? 0} blocks · Created {created}
      </div>
    </div>
  );
}
