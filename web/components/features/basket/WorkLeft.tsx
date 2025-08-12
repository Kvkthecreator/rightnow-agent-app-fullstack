'use client';
import Link from 'next/link';
import { useBasket } from './hooks';

export default function WorkLeft({ basketId }: { basketId: string }) {
  const { data } = useBasket(basketId);
  const base = `/baskets/${basketId}`;
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-muted-foreground">Basket</div>
        <div className="font-medium truncate">{data?.title ?? 'Untitled'}</div>
        <div className="text-xs">{data?.status ?? 'INIT'}</div>
      </div>
      <nav className="space-y-1 text-sm">
        <Link href={`${base}/work`} className="block hover:underline">Dashboard</Link>
        <Link href={`${base}/work/blocks`} className="block hover:underline">Blocks</Link>
        <Link href={`${base}/work/context`} className="block hover:underline">Context</Link>
        <Link href={`${base}/work/documents`} className="block hover:underline">Documents</Link>
        <Link href={`${base}/insights`} className="block hover:underline">Insights</Link>
        <Link href={`${base}/history`} className="block hover:underline">History</Link>
      </nav>
      {/* TODO: documents tree */}
    </div>
  );
}
