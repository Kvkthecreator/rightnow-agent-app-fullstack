import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<
  HTMLInputElement,
  InputProps
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "input-base",
        "h-10 shadow-soft",
        "hover:border-border/80",
        "focus-visible:border-ring",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";