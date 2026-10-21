/**
 * Upstream: shadcn/ui `card`, style `radix-nova`, shadcn CLI 4.22.1.
 * Review upstream changes with `pnpm dlx shadcn@latest add card --diff` (never `--overwrite`).
 * Deviations:
 *  - `cn` comes from ../../lib/cn, not the `cn` package
 *  - the card is a named container (`@container/card`): padding and the CardAction column respond
 *    to the card's width, not the viewport; narrow cards stack the action below the title
 *  - header layout uses an explicit 1-column grid; CardAction opens an implicit auto-sized second
 *    column, replacing upstream's arbitrary `grid-cols-[1fr_auto]` and `--card-spacing` variables
 *  - CardTitle renders a heading (`h3` by default, `as` prop for other levels) instead of a div
 *  - footer wraps its items so long buttons never overflow
 *  - `size` variant, image slots and the muted footer band are left out until needed
 *  - no "use client": renders in Server Components
 */
import type { ComponentProps } from "react"

import { cn } from "../../lib/cn"

function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "@container/card flex flex-col gap-4 overflow-hidden rounded-xl border bg-card py-4 text-sm text-card-foreground shadow-sm @md/card:gap-6 @md/card:py-6",
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min grid-cols-1 items-start gap-x-4 gap-y-1.5 px-4 @md/card:px-6",
        className,
      )}
      {...props}
    />
  )
}

type CardTitleProps = ComponentProps<"h3"> & {
  /** Heading level that fits the surrounding document outline. */
  as?: "h2" | "h3" | "h4" | "h5" | "h6"
}

function CardTitle({
  as: Heading = "h3",
  className,
  ...props
}: CardTitleProps) {
  return (
    <Heading
      data-slot="card-title"
      className={cn("text-base leading-snug font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "justify-self-start @sm/card:col-start-2 @sm/card:row-span-2 @sm/card:row-start-1 @sm/card:self-start @sm/card:justify-self-end",
        className,
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4 @md/card:px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex flex-wrap items-center gap-2 px-4 @md/card:px-6",
        className,
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardTitleProps,
}
