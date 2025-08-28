import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles - Apple-like with explicit styling
  "inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-lg shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-md hover:shadow-lg dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
        outline: "border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800",
        ghost: "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 shadow-none",
        destructive: "bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg"
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-10 px-4 text-sm rounded-lg", 
        lg: "h-12 px-8 text-base rounded-xl",
        icon: "h-10 w-10 rounded-lg"
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
