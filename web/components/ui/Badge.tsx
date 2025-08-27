import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-base",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-soft border-0",
        secondary: "bg-secondary text-secondary-foreground shadow-soft border-0",
        outline: "text-foreground border border-border bg-background",
        destructive: "bg-destructive text-white shadow-soft border-0",
        success: "bg-green-500 text-white shadow-soft border-0",
        warning: "bg-yellow-500 text-black shadow-soft border-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
Badge.displayName = "Badge";

export { Badge, badgeVariants };
