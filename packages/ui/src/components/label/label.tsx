/**
 * Upstream: shadcn/ui `label`, style `radix-nova`, shadcn CLI 4.22.1.
 * Review upstream changes with `pnpm dlx shadcn@latest add label --diff` (never `--overwrite`).
 * Deviations:
 *  - `cn` comes from ../../lib/cn, not the `cn` package
 *  - disabled-field dimming keys off Field's `data-disabled` attribute (no arbitrary `[disabled=true]` variant)
 */
"use client"

import type { ComponentProps } from "react"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "../../lib/cn"

function Label({
  className,
  ...props
}: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-disabled/field:pointer-events-none group-data-disabled/field:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export { Label }
