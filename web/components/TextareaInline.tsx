"use client";
import React, { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaInlineProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

/**
 * Inline-editable textarea: looks like text until focused,
 * then shows an underline and focus ring.
 */
export function TextareaInline({ className, ...props }: TextareaInlineProps) {
  return (
    <textarea
      {...props}
      className={cn(
        "bg-transparent border-0 border-b border-transparent focus:border-b focus:border-primary focus:ring-0 resize-none",
        className
      )}
    />
  );
}
TextareaInline.displayName = "TextareaInline";