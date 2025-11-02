"use client";
import React from "react";
import { cn } from "@/lib/utils";

export interface ProgressStepperProps {
  /** Current active step (1-based index) */
  current: number;
  /** Array of step labels */
  steps: string[];
}

/**
 * A horizontal stepper showing progress across multiple steps.
 * Uses theme color variables for active/completed states.
 */
export function ProgressStepper({ current, steps }: ProgressStepperProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-around gap-4 w-full max-w-2xl mx-auto px-4">
      {steps.map((label, idx) => (
        <React.Fragment key={idx}>
          <div className="flex flex-col items-center flex-shrink-0 min-w-[80px]">
            <div
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-full border transition-colors",
                idx + 1 <= current
                  ? "bg-primary border-primary"
                  : "bg-background border-border"
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  idx + 1 <= current
                    ? "text-primary-foreground"
                    : "text-foreground"
                )}
              >
                {idx + 1}
              </span>
            </div>
            <span className="text-sm text-muted-foreground mt-2 text-center">
              {label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={cn(
                "flex-1 h-1 mx-2 rounded",
                idx + 1 < current ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}