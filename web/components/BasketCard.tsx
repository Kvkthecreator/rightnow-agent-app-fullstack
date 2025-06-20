"use client";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";

export interface BasketCardProps {
  basket: {
    id: string;
    name?: string | null;
    raw_dump_body?: string | null;
    created_at?: string | null;
  };
}

export default function BasketCard({ basket }: BasketCardProps) {
  const router = useRouter();
  const created = basket.created_at
    ? format(new Date(basket.created_at), "PPP")
    : "";
  const preview =
    basket.raw_dump_body?.slice(0, 150) || "No dump yet. Add something?";
  return (
    <div
      className="rounded-md border p-4 hover:bg-muted cursor-pointer"
      onClick={() => router.push(`/baskets/${basket.id}/work`)}
    >
      <div className="flex justify-between">
        <h3 className="text-md font-semibold truncate">
          🧺 {basket.name || "Untitled Basket"}
        </h3>
      </div>
      {preview && (
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {preview}
        </p>
      )}
      <div className="text-xs mt-2 text-muted-foreground">Created {created}</div>
    </div>
  );
}
