'use client';
export default function DocumentsCenter({ basketId }:{ basketId:string }) {
  return (
    <div className="p-4 text-sm text-muted-foreground">Documents TODO for {basketId}</div>
  );
}
