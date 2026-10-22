/**
 * Upstream: shadcn/ui `input`, style `radix-nova`, shadcn CLI 4.22.1.
 * Review upstream changes with `pnpm dlx shadcn@latest add input --diff` (never `--overwrite`).
 * Deviations:
 *  - `cn` comes from ../../lib/cn, not the `cn` package
 *  - height uses the control-size token and grows to the 44px touch target on coarse pointers
 *  - focus indicator is a 2px `ring` outline (survives forced-colors mode), destructive when invalid
 *  - opaque `bg-background` and no `dark:` overrides: themes come entirely from tokens
 *  - file button spacing uses logical `me-` so it works in RTL; it gets a pointer cursor
 *  - disabled uses the `disabled` color tokens (surface, text, border, placeholder) instead of `opacity-50`
 *  - no "use client": a plain input renders in Server Components; pass handlers from client code
 */
import type { ComponentProps } from "react"

import { cn } from "../../lib/cn"

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // text-base below md keeps iOS from zooming into focused inputs (it zooms under 16px).
        "min-h-control-md w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-base text-foreground transition-colors outline-none file:me-3 file:cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled disabled:text-disabled-foreground disabled:file:cursor-not-allowed disabled:file:text-disabled-foreground disabled:placeholder:text-disabled-foreground aria-invalid:border-destructive aria-invalid:focus-visible:outline-destructive md:text-sm pointer-coarse:min-h-touch",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
