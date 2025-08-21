"use client";
import Link from "next/link";

export function SubpageHeader({ title, basketId }: { title: string; basketId: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      <Link href={`/baskets/${basketId}/memory`} className="text-sm underline">
        Back to Memory
      </Link>
    </div>
  );
}
