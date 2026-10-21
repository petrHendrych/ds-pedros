/**
 * Upstream: shadcn/ui `button`, style `radix-nova`, shadcn CLI 4.22.1.
 * Review upstream changes with `pnpm dlx shadcn@latest add button --diff` (never `--overwrite`).
 * Deviations:
 *  - `cn` comes from ../../lib/cn (clsx + tailwind-merge aware of our tokens), not the `cn` package
 *  - sizes are sm | md | lg | icon-sm | icon | icon-lg and use control-size tokens
 *  - labels wrap instead of overflowing (min-h + py, no whitespace-nowrap) for narrow viewports
 *  - coarse pointers get a 44px minimum target (pointer-coarse:min-h-touch / min-w-touch)
 *  - focus indicator is a 2px `ring` outline (survives forced-colors mode), not a translucent box-shadow
 *  - no `dark:` overrides and no arbitrary values: themes and brands come entirely from tokens
 *  - destructive is a solid fill with `destructive-foreground` text
 *  - `type="button"` by default so buttons never submit forms by accident
 */
"use client"

import type { ComponentProps } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "../../lib/cn"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent text-center text-sm font-medium outline-hidden transition-colors select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive pointer-coarse:min-h-touch [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "min-h-control-sm px-3 py-1",
        md: "min-h-control-md px-4 py-2",
        lg: "min-h-control-lg px-6 py-2 text-base",
        "icon-sm": "size-control-sm pointer-coarse:min-w-touch",
        icon: "size-control-md pointer-coarse:min-w-touch",
        "icon-lg": "size-control-lg pointer-coarse:min-w-touch",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
)

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

export { Button, buttonVariants, type ButtonProps }
