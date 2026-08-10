// @ts-nocheck
import { cn } from "@/lib/utils"
import { cva, VariantProps } from "class-variance-authority"
import React from "react"

const fieldRowVariants = cva("grid gap-4", {
  variants: {
    cols: {
      1: "grid-cols-1",
      2: "md:grid-cols-2",
      3: "md:grid-cols-3",
      4: "md:grid-cols-4",
    },
  },
  defaultVariants: {
    cols: 2,
  },
})

interface FieldRowProps {
  className?: string
  cols?: 1 | 2 | 3 | 4
  children?: React.ReactNode
  [key: string]: any
}

function FieldRow({
  className,
  cols,
  children,
  ...props
}: FieldRowProps) {
  return (
    <div
      data-slot="field-row"
      className={cn(fieldRowVariants({ cols }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

export default FieldRow