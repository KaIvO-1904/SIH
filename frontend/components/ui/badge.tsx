import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-black text-white hover:bg-zinc-800",
      secondary: "bg-zinc-100 text-black hover:bg-zinc-200",
      outline: "border border-zinc-200 text-zinc-900",
      success: "bg-green-100 text-green-700 border border-green-200",
      warning: "bg-yellow-100 text-yellow-700 border border-yellow-200",
      danger: "bg-red-100 text-red-700 border border-red-200",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
