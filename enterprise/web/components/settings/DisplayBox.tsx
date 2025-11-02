import React from "react";

export default function DisplayBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-muted-foreground mb-1">
        {label}
      </label>
      <div className="rounded-md border bg-muted px-3 py-2 text-sm">{value}</div>
    </div>
  );
}
