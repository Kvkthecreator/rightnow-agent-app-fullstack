"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

export interface LoadingOverlayProps {
  message?: string;
}

/**
 * A reusable loading overlay displayed within a Card.
 * Covers the parent container and centers a spinner and message.
 */
export function LoadingOverlay({ message = "Loading..." }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center rounded-2xl",
        "bg-card/80"
      )}
    >
      <Spinner className="mb-4" />
      <p className="text-base text-foreground">{message}</p>
    </div>
  );
}