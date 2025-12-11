"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CollapsibleProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

const Collapsible = ({ children, open, onOpenChange, className }: CollapsibleProps) => {
  const [internalOpen, setInternalOpen] = React.useState(open ?? false)
  
  const isOpen = open !== undefined ? open : internalOpen
  
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }
  
  return (
    <div className={cn("", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === CollapsibleTrigger) {
            return React.cloneElement(child as React.ReactElement<CollapsibleTriggerProps>, {
              onClick: () => handleOpenChange(!isOpen),
              isOpen
            })
          }
          if (child.type === CollapsibleContent) {
            return React.cloneElement(child as React.ReactElement<CollapsibleContentProps>, {
              isOpen
            })
          }
        }
        return child
      })}
    </div>
  )
}

interface CollapsibleTriggerProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  isOpen?: boolean
}

const CollapsibleTrigger = ({ 
  children, 
  className, 
  onClick,
  isOpen
}: CollapsibleTriggerProps) => {
  return (
    <button 
      type="button" 
      className={cn("", className)}
      onClick={onClick}
      aria-expanded={isOpen}
    >
      {children}
    </button>
  )
}

interface CollapsibleContentProps {
  children: React.ReactNode
  className?: string
  isOpen?: boolean
}

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  CollapsibleContentProps
>(({ className, children, isOpen, ...props }, ref) => {
  return isOpen ? (
    <div
      ref={ref}
      className={cn(
        "animate-collapsible-down overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  ) : null
})
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent } 