"use client";

import { TodayReflectionCard, ReflectionCards, MemoryStream, AddMemoryComposer } from "@/components/basket";

interface Props {
  basketId: string;
  pattern?: string;
  tension?: string | null;
  question?: string;
  fallback: string;
}

export default function DashboardClient({ basketId, pattern, tension, question, fallback }: Props) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12">
        <TodayReflectionCard line={undefined} fallback={fallback} />
      </div>
      <div className="col-span-8 space-y-4">
        <AddMemoryComposer basketId={basketId} />
        <MemoryStream basketId={basketId} />
      </div>
      <div className="col-span-4">
        <ReflectionCards pattern={pattern} tension={tension} question={question || null} />
      </div>
    </div>
  );
}

