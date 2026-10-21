import { HEADER } from "./header.ts"
import type { ResolvedToken } from "./resolve.ts"

const isColor = (token: ResolvedToken) => token.path[0] === "color"

function block(
  selector: string,
  tokens: ResolvedToken[],
  scheme: "light" | "dark",
  indent = "",
): string {
  const lines = [
    `color-scheme: ${scheme};`,
    ...tokens.map((token) => `${token.name}: ${token.value};`),
  ]
  const body = lines.map((line) => `${indent}  ${line}`).join("\n")
  return `${indent}${selector} {\n${body}\n${indent}}\n`
}

/** One brand stylesheet: light on :root, dark via [data-theme="dark"] or the OS preference. */
export function brandCss(
  light: ResolvedToken[],
  dark: ResolvedToken[],
): string {
  const darkColors = dark.filter(isColor)
  return [
    HEADER,
    block(':root,\n[data-theme="light"]', light, "light"),
    block('[data-theme="dark"]', darkColors, "dark"),
    "@media (prefers-color-scheme: dark) {\n" +
      block(':root:not([data-theme="light"])', darkColors, "dark", "  ") +
      "}\n",
  ].join("\n")
}

/** Tailwind theme variable for a token path, or undefined for private (primitive) tokens. */
export function themeVarFor(path: string[]): string | undefined {
  const [group, ...rest] = path
  const suffix = rest.join("-")
  switch (group) {
    case "color":
      return `--color-${suffix}`
    case "radius":
      return `--radius-${suffix}`
    case "font":
      return `--font-${suffix}`
    case "size":
      return `--spacing-${suffix}`
    default:
      return undefined
  }
}

export function themeCss(tokens: ResolvedToken[]): string {
  const mappings = tokens.flatMap((token) => {
    const themeVar = themeVarFor(token.path)
    return themeVar ? [`  ${themeVar}: var(${token.name});`] : []
  })
  return `${HEADER}
@custom-variant dark {
  &:where([data-theme="dark"], [data-theme="dark"] *) {
    @slot;
  }
  @media (prefers-color-scheme: dark) {
    &:where(:root:not([data-theme="light"]), :root:not([data-theme="light"]) *) {
      @slot;
    }
  }
}

@theme inline {
  --color-*: initial;
  --radius-*: initial;
${mappings.join("\n")}
}

@layer base {
  /* --ds- variables (not Tailwind's --color-*) so nested [data-theme] subtrees re-resolve. */
  *,
  ::before,
  ::after {
    border-color: var(--ds-color-border);
  }
  body {
    background-color: var(--ds-color-background);
    color: var(--ds-color-foreground);
    font-family: var(--ds-font-sans);
  }
}
`
}
