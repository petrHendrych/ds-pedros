import { describe, expect, it } from "vitest"
import { resolveTokens } from "../src/resolve.ts"
import { DEFAULT_BRAND, listBrands, MODES, type Mode } from "../src/sources.ts"

async function names(brand: string, mode: Mode): Promise<string[]> {
  return (await resolveTokens(brand, mode)).map((token) => token.name).sort()
}

describe("token parity", () => {
  it("lists the default brand first and seeds at least two brands", () => {
    expect(listBrands()[0]).toBe(DEFAULT_BRAND)
    expect(listBrands().length).toBeGreaterThanOrEqual(2)
  })

  it.each(
    listBrands().flatMap((brand) =>
      MODES.map((mode) => [brand, mode] as const),
    ),
  )("%s/%s declares exactly the tokens of acme/light", async (brand, mode) => {
    expect(await names(brand, mode)).toEqual(
      await names(DEFAULT_BRAND, "light"),
    )
  })
})
