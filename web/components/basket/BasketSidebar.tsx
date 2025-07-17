"use client";
import BasketSidebarHeader from "./BasketSidebarHeader";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

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
  const params = useSearchParams();
  const currentTab = params.get("tab") || "dashboard";
  return (
    <aside className="w-[260px] border-r shrink-0 flex flex-col p-4 space-y-6">
      <BasketSidebarHeader
        basketName={basketName}
        status={status}
        scope={scope}
      />
      <nav className="flex flex-col gap-2 text-sm">
        <Link
          href={`/baskets/${basketId}/work?tab=dashboard`}
          className={cn(currentTab === "dashboard" && "font-semibold")}
        >
          Dashboard
        </Link>
        <Link
          href={`/baskets/${basketId}/work?tab=insights`}
          className={cn(currentTab === "insights" && "font-semibold")}
        >
          Insights
        </Link>
        <Link
          href={`/baskets/${basketId}/work?tab=history`}
          className={cn(currentTab === "history" && "font-semibold")}
        >
          History
        </Link>
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
