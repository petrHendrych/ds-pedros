/**
 * Upstream: shadcn/ui `button`, style `radix-nova`, shadcn CLI 4.22.1.
 * Review upstream changes with `pnpm dlx shadcn@latest add button --diff` (never `--overwrite`).
 * Deviations:
 *  - `cn` comes from ../../lib/cn (clsx + tailwind-merge aware of our tokens), not the `cn` package
 *  - sizes are sm | md | lg | icon-sm | icon | icon-lg and use control-size tokens
 *  - labels wrap instead of overflowing (min-h + py, wrap-anywhere, no whitespace-nowrap/shrink-0) for narrow viewports and flex rows
 *  - coarse pointers get a 44px minimum target (pointer-coarse:min-h-touch / min-w-touch)
 *  - focus indicator is a 2px `ring` outline (survives forced-colors mode), not a translucent box-shadow; no outline when unfocused
 *  - no `dark:` overrides and no arbitrary values: themes and brands come entirely from tokens
 *  - destructive is a solid fill with `destructive-foreground` text
 *  - `type="button"` by default so buttons never submit forms by accident
 *  - `cursor-pointer` (Tailwind v4 preflight resets buttons to the default cursor)
 *  - disabled uses the `disabled` color tokens per variant instead of `opacity-50`, and keeps pointer
 *    events (no `pointer-events-none`) so the not-allowed cursor shows; disabled colors outrank hover
 *  - `buttonVariants` lives in the directive-free ./button-variants so Server Components can call it
 */
"use client"

import type { ComponentProps } from "react"
import type { VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "../../lib/cn"
import { buttonVariants } from "./button-variants"

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. a link) with button styles instead of a <button>. */
    asChild?: boolean
  }

function Button({
  className,
  variant,
  size,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? "default"}
      data-size={size ?? "md"}
      type={asChild ? type : (type ?? "button")}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, type ButtonProps }
