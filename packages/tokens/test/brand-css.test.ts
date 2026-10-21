import { describe, expect, it } from "vitest"
import { brandCss } from "../src/css.ts"
import { resolveTokens } from "../src/resolve.ts"
import { listBrands } from "../src/sources.ts"

const LIGHT = ':root,\n[data-theme="light"]'
const DARK = '[data-theme="dark"]'

async function cssFor(brand: string): Promise<string> {
  return brandCss(
    await resolveTokens(brand, "light"),
    await resolveTokens(brand, "dark"),
  )
}

function block(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`selector not found: ${selector}`)
  return css.slice(start, css.indexOf("}", start))
}

describe("brandCss", () => {
  it.each(listBrands())(
    "%s: light on :root, dark via attribute and OS preference",
    async (brand) => {
      const css = await cssFor(brand)
      expect(block(css, LIGHT)).toContain("--ds-color-background: oklch(")
      expect(block(css, DARK)).toContain("--ds-color-background: oklch(")
      expect(css).toContain("@media (prefers-color-scheme: dark)")
    },
  )

  it("lets an explicit light theme win over a dark OS preference", async () => {
    const css = await cssFor("acme")
    const media = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"))
    expect(media).toContain(':root:not([data-theme="light"]) {')
  })

  it("re-declares only color tokens in dark blocks", async () => {
    const dark = block(await cssFor("acme"), DARK)
    expect(dark).toContain("color-scheme: dark;")
    expect(dark).not.toContain("--ds-radius-")
    expect(dark).not.toContain("--ds-palette-")
  })

  it("applies brand overrides on top of the semantic defaults", async () => {
    const acme = block(await cssFor("acme"), LIGHT)
    const nova = block(await cssFor("nova"), LIGHT)
    const primary = (css: string) =>
      css.match(/--ds-color-primary: ([^;]+);/)?.[1]
    expect(primary(nova)).toBeDefined()
    expect(primary(nova)).not.toBe(primary(acme))
    expect(acme).toMatch(/--ds-font-sans: [^;]*Inter Variable/)
    expect(nova).toMatch(/--ds-font-sans: [^;]*Geist Variable/)
  })
})
