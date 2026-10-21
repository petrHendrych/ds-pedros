import { describe, expect, it } from "vitest"
import { themeCss, themeVarFor } from "../src/css.ts"
import { resolveTokens } from "../src/resolve.ts"

describe("themeCss", () => {
  it("maps semantic tokens into Tailwind namespaces", async () => {
    const css = themeCss(await resolveTokens("acme", "light"))
    expect(css).toContain("--color-background: var(--ds-color-background);")
    expect(css).toContain(
      "--color-muted-foreground: var(--ds-color-muted-foreground);",
    )
    expect(css).toContain("--radius-md: var(--ds-radius-md);")
    expect(css).toContain("--font-sans: var(--ds-font-sans);")
    expect(css).toContain("--spacing-control-md: var(--ds-size-control-md);")
    expect(css).toContain("--spacing-touch: var(--ds-size-touch);")
  })

  it("removes Tailwind's default palette and radius so only tokens exist", async () => {
    const css = themeCss(await resolveTokens("acme", "light"))
    expect(css).toContain("--color-*: initial;")
    expect(css).toContain("--radius-*: initial;")
    expect(css).not.toContain("palette")
  })

  it("keeps primitives out of Tailwind", () => {
    expect(themeVarFor(["palette", "neutral", "0"])).toBeUndefined()
  })

  it("defines a dark variant that follows data-theme and the OS preference", async () => {
    const css = themeCss(await resolveTokens("acme", "light"))
    expect(css).toContain("@custom-variant dark {")
    expect(css).toContain('[data-theme="dark"]')
    expect(css).toContain(':root:not([data-theme="light"])')
  })

  it("styles the base layer from --ds- variables so nested data-theme subtrees re-resolve", async () => {
    const base =
      themeCss(await resolveTokens("acme", "light")).split("@layer base")[1] ??
      ""
    expect(base).toContain("border-color: var(--ds-color-border);")
    expect(base).toContain("background-color: var(--ds-color-background);")
    expect(base).toContain("color: var(--ds-color-foreground);")
    expect(base).not.toContain("var(--color-")
  })
})
