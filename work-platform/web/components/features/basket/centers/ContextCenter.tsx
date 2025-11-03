'use client';
export default function ContextCenter({ basketId }:{ basketId:string }) {
  return (
    <div className="p-4 text-sm text-muted-foreground">Context TODO for {basketId}</div>
  );
}
