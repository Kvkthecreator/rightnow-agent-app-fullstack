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
 * CardContent wraps the content area inside a Card.
 */
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4", className)} {...props} />
  );
}
