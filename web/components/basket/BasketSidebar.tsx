"use client";
import BasketSidebarHeader from "./BasketSidebarHeader";
import Link from "next/link";

interface Props {
  basketId: string;
  basketName: string;
  status: string;
  scope: string[];
}

export default function BasketSidebar({
  basketId,
  basketName,
  status,
  scope,
}: Props) {
  return (
    <aside className="w-[260px] border-r shrink-0 flex flex-col p-4 space-y-6">
      <BasketSidebarHeader
        basketName={basketName}
        status={status}
        scope={scope}
      />
      <nav className="flex flex-col gap-2 text-sm">
        <Link href={`/baskets/${basketId}/work`}>Dashboard</Link>
        <Link href={`/baskets/${basketId}/insights`}>Insights</Link>
        <Link href={`/baskets/${basketId}/history`}>History</Link>
      </nav>
      <div className="text-xs font-semibold text-muted-foreground space-y-2">
        <p>Context Items</p>
        <p>Text Blocks</p>
        <p>Documents</p>
        <p>Raw Dumps</p>
      </div>
    </aside>
  );
}
