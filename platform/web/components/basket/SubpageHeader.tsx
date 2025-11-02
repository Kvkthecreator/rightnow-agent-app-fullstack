"use client";
import Link from "next/link";

export function SubpageHeader({ 
  title, 
  basketId, 
  description,
  rightContent
}: { 
  title: string; 
  basketId: string; 
  description?: string;
  rightContent?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      {rightContent || (
        <Link href={`/baskets/${basketId}/overview`} className="text-sm underline">
          Back to Memory
        </Link>
      )}
    </div>
  );
}
