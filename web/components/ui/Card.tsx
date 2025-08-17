import React from "react";
import { cn } from "@/lib/utils"

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Use theme variables for card styling
        "bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * CardHeader wraps the header area inside a Card.
 */
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("pb-4", className)} {...props} />
  );
}

/**
 * CardTitle provides styled title for Card header.
 */
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-semibold text-foreground", className)} {...props} />
  );
}

/**
 * CardContent wraps the content area inside a Card.
 */
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4", className)} {...props} />
  );
}
