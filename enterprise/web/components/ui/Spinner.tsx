"use client";
import React from "react";
import { cn } from "@/lib/utils";

export interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "w-6 h-6 rounded-full border-4 border-border border-t-primary animate-spin",
        className
      )}
    />
  );
}