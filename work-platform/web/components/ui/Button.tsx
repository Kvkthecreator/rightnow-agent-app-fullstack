import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles - Apple-like with explicit styling and enhanced hover states
  "inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-lg active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg active:shadow-sm dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-md hover:shadow-lg active:shadow-sm dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
        outline: "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
        ghost: "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100",
        destructive: "bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg active:shadow-sm",
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg active:shadow-sm dark:bg-blue-500 dark:hover:bg-blue-600"
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-md gap-1",
        sm: "h-8 px-3 text-xs rounded-md gap-1.5",
        md: "h-9 px-4 text-sm rounded-lg gap-2", 
        lg: "h-11 px-8 text-base rounded-xl gap-2",
        icon: "h-9 w-9 rounded-lg"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
)


export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
