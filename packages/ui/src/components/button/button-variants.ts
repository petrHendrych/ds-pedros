import { cva } from "class-variance-authority"

// Kept out of button.tsx so Server Components can call it (e.g. <Link className={buttonVariants()} />):
// everything exported from a "use client" module becomes a client reference.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md border border-transparent text-center text-sm font-medium wrap-anywhere transition-colors outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive pointer-coarse:min-h-touch pointer-coarse:min-w-touch [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
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
        "icon-sm": "size-control-sm shrink-0",
        icon: "size-control-md shrink-0",
        "icon-lg": "size-control-lg shrink-0",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
)
