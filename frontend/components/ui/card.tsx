import React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, subtitle, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white border border-zinc-200 rounded-3xl shadow-sm transition-all hover:shadow-md",
          className
        )}
        {...props}
      >
        {(title || subtitle) && (
          <div className="p-6 border-b border-zinc-100">
            {title && <h3 className="text-lg font-bold tracking-tight">{title}</h3>}
            {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    )
  }
)
Card.displayName = "Card"

export { Card }
