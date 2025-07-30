"use client";
import { IntelligenceDashboard } from "@/components/baskets/IntelligenceDashboard";
import type { Document } from "@/types";

interface Props {
  basketId: string;
  dumpBody?: string;
  empty?: boolean;
  basketName?: string;
  documents?: Document[];
}

export default function BasketDashboard({
  basketId,
  dumpBody,
  empty = false,
  basketName,
  documents,
}: Props) {
  return (
    <div className="p-6 h-full">
      <IntelligenceDashboard basketId={basketId} />
    </div>
  );
}