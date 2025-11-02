//web/components/library/progress.tsx

import * as React from "react";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
}

export function Progress({ value, max = 100, className, ...props }: ProgressProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={`w-full h-2 rounded bg-muted overflow-hidden ${className}`}
      {...props}
    >
      <div
        className="h-full bg-primary transition-all duration-200"
        style={{ width: `${Math.min(value, max)}%` }}
      />
    </div>
  );
}
