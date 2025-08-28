import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 shadow-sm resize-y",
        "hover:border-slate-300 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-400 dark:hover:border-slate-600 dark:focus:border-slate-500 dark:focus:ring-slate-800",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
