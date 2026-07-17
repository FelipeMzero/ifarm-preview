import { cn } from "@/lib/utils"
import { cva, VariantProps } from "class-variance-authority"

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

function FieldRow({
  className,
  cols,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldRowVariants>) {
  return (
    <div
      data-slot="field-row"
      className={cn(fieldRowVariants({ cols }), className)}
      {...props}
    />
  )
}

export default FieldRow