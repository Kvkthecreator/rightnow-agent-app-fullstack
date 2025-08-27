import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<
  HTMLInputElement,
  InputProps
>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-border bg-input text-foreground placeholder:text-muted-foreground/70 px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring/50 transition-colors disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";