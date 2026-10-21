import { wcagContrast } from "culori"
import { describe, expect, it } from "vitest"
import { resolveTokens } from "../src/resolve.ts"
import { listBrands, MODES } from "../src/sources.ts"

const TEXT_PAIRS = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["muted-foreground", "muted"],
  ["muted-foreground", "background"],
  ["accent-foreground", "accent"],
  ["destructive-foreground", "destructive"],
  ["success-foreground", "success"],
  ["warning-foreground", "warning"],
  ["info-foreground", "info"],
  ["primary", "background"],
  ["destructive", "background"],
  ["success", "background"],
  ["info", "background"],
] as const

const NON_TEXT_PAIRS = [
  ["input", "background"],
  ["ring", "background"],
] as const

const cases = listBrands().flatMap((brand) =>
  MODES.map((mode) => [brand, mode] as const),
)

describe.each(cases)("%s/%s contrast (WCAG 2.2 AA)", (brand, mode) => {
  async function ratio(fg: string, bg: string): Promise<number> {
    const tokens = await resolveTokens(brand, mode)
    const colors = new Map(
      tokens
        .filter((token) => token.path[0] === "color")
        .map((token) => [token.path.slice(1).join("-"), token.value]),
    )
    const a = colors.get(fg)
    const b = colors.get(bg)
    if (!a || !b) throw new Error(`missing color token: ${a ? bg : fg}`)
    return wcagContrast(a, b)
  }

  it.each(TEXT_PAIRS)("text %s on %s is at least 4.5:1", async (fg, bg) => {
    expect(await ratio(fg, bg)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(NON_TEXT_PAIRS)("%s against %s is at least 3:1", async (fg, bg) => {
    expect(await ratio(fg, bg)).toBeGreaterThanOrEqual(3)
  })
})
