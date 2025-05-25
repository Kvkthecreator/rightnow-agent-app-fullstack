"use client";
import React, { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputInlineProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

/**
 * Inline-editable input: looks like text until focused,
 * then shows an underline and focus ring.
 */
export function InputInline({ className, ...props }: InputInlineProps) {
  return (
    <input
      {...props}
      className={cn(
        "bg-transparent border-0 border-b border-transparent focus:border-b focus:border-primary focus:ring-0",
        className
      )}
    />
  );
}
InputInline.displayName = "InputInline";