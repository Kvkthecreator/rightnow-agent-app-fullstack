'use client';
export default function InsightsCenter({ basketId }:{ basketId:string }) {
  return (
    <div className="p-4 text-sm text-muted-foreground">Insights TODO for {basketId}</div>
  );
}
