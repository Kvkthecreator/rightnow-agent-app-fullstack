"use client";

import { useState } from "react";
import { TodayReflectionCard, ReflectionCards, MemoryStream, AddMemoryComposer } from "@/components/basket";
import type { Note } from "@/lib/reflection";

interface Props {
  basketId: string;
  initialNotes: Note[];
  pattern?: string;
  tension?: { a: string; b: string } | null;
  question?: string;
  fallback: string;
}

export default function DashboardClient({ basketId, initialNotes, pattern, tension, question, fallback }: Props) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12">
        <TodayReflectionCard line={undefined} fallback={fallback} />
      </div>
      <div className="col-span-8 space-y-4">
        <AddMemoryComposer
          basketId={basketId}
          onSuccess={(dump) =>
            setNotes((prev) => [
              ...prev,
              { id: dump.id, text: dump.text_dump || "", created_at: dump.created_at },
            ])
          }
        />
        <MemoryStream items={notes} />
      </div>
      <div className="col-span-4">
        <ReflectionCards pattern={pattern} tension={tension} question={question || null} />
      </div>
    </div>
  );
}

