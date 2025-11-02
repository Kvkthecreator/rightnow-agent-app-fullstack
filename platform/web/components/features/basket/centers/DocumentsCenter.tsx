'use client';
import Link from 'next/link';

export default function DocumentsCenter({ basketId }:{ basketId:string }) {
  const fakeDocs = [{ id: 'doc-1', title: 'Untitled' }];
  return (
    <div className="space-y-2">
      <div className="text-lg font-semibold">Documents</div>
      <ul className="space-y-1">
        {fakeDocs.map(d => (
          <li key={d.id}>
            <Link className="underline" href={`/baskets/${basketId}/documents/${d.id}`} prefetch={false}>
              {d.title}
            </Link>
          </li>
        ))}
      </ul>
      <div className="text-xs text-muted-foreground">Replace with real documents list.</div>
    </div>
  );
}
