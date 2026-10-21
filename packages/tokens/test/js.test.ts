import { describe, expect, it } from "vitest"
import { tokensModule, tokensTree } from "../src/js.ts"
import { resolveTokens } from "../src/resolve.ts"

describe("tokensModule", () => {
  it("exposes public tokens as CSS variable references", async () => {
    const tree = tokensTree(await resolveTokens("acme", "light"))
    expect(tree).toMatchObject({
      color: { "primary-foreground": "var(--ds-color-primary-foreground)" },
      size: {
        control: { md: "var(--ds-size-control-md)" },
        touch: "var(--ds-size-touch)",
      },
    })
    expect(tree).not.toHaveProperty("palette")
  })

  it("emits matching JS and type declarations", async () => {
    const tokens = await resolveTokens("acme", "light")
    const { js, dts } = tokensModule(tokens, ["acme", "nova"])
    expect(js).toContain('export const brands = ["acme","nova"];')
    expect(js).toContain(
      `export const tokens = ${JSON.stringify(tokensTree(tokens), null, 2)};`,
    )
    expect(dts).toContain(
      'export declare const brands: readonly ["acme","nova"];',
    )
    expect(dts).toContain("export declare const tokens: {")
  })
})
