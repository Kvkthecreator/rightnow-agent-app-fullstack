'use client';
import Link from 'next/link';
import { format } from 'date-fns';

export interface BasketCardProps {
  basket: {
    id: string;
    name?: string | null;
    teaser?: string | null;
    created_at?: string | null;
  };
}

export default function BasketCard({ basket }: BasketCardProps) {
  const created = basket.created_at
    ? format(new Date(basket.created_at), 'PPP')
    : '';
  return (
    <Link
      href={`/baskets/${basket.id}/memory`}
      prefetch={false}
      className="rounded-md border p-4 hover:bg-muted block"
    >
      <div className="flex justify-between">
        <h3 className="text-md font-semibold truncate">
          🧺 {basket.name || 'Untitled Basket'}
        </h3>
      </div>
      {basket.teaser && (
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {basket.teaser}
        </p>
      )}
      {created && (
        <div className="text-xs mt-2 text-muted-foreground">
          Created {created}
        </div>
      )}
    </Link>
  );
}
