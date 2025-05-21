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
        // Theme-based input styling
        "w-full p-3 rounded-lg border border-input bg-input text-base text-foreground shadow-sm placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";