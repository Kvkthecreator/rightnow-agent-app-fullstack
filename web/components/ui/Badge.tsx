import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium transition-all duration-200 shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
        secondary: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
        outline: "border-2 border-slate-200 text-slate-900 bg-white dark:border-slate-700 dark:text-slate-100 dark:bg-slate-900",
        destructive: "bg-red-500 text-white",
        success: "bg-green-500 text-white",
        warning: "bg-yellow-500 text-slate-900",
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
