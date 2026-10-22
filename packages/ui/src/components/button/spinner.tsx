import type { ComponentProps } from "react"

import { cn } from "../../lib/cn"

/**
 * Loading indicator for Button. Decorative: Button announces the busy state with `aria-busy`.
 * Inline SVG (arc path as in lucide's `loader-circle`, ISC) so the package needs no icon dependency.
 */
function Spinner({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      data-slot="spinner"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
      className={cn("size-4 shrink-0 motion-safe:animate-spin", className)}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

export { Spinner }
