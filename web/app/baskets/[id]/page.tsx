"use client";

import { IntelligenceDashboard } from "@/components/baskets/IntelligenceDashboard";

export default function BasketDetailPage({ params }: any) {
  return (
    <div className="flex h-screen">
      <div className="flex-1 overflow-hidden p-6">
        <IntelligenceDashboard basketId={params.id} />
      </div>
    </div>
  );
}
