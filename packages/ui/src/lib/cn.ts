import { tokens } from "@acme/tokens"
import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

type TokenTree = { readonly [key: string]: string | TokenTree }

/** Flattens a token subtree into Tailwind suffixes: { control: { sm } } → ["control-sm"]. */
function tokenSuffixes(tree: TokenTree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const name = prefix ? `${prefix}-${key}` : key
    return typeof value === "string" ? [name] : tokenSuffixes(value, name)
  })
}

// Teach tailwind-merge our custom spacing names so `h-8 h-control-md` resolves to one class.
const twMerge = extendTailwindMerge({
  extend: { theme: { spacing: tokenSuffixes(tokens.size) } },
})

/** Merges class names; on Tailwind conflicts the later class wins. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
