"use client";

import { DumpBarContent } from "./DumpBarPanel";

export default function DumpBarHero({ basketId }: { basketId: string }) {
  return (
    <div className="border rounded-2xl p-4">
      <DumpBarContent basketId={basketId} autoFocus />
    </div>
  );
}
