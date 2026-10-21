import { existsSync, readdirSync } from "node:fs"
import path from "node:path"

export type Mode = "light" | "dark"
export const MODES = ["light", "dark"] as const satisfies readonly Mode[]
export const DEFAULT_BRAND = "acme"
export const TOKENS_DIR = path.resolve(import.meta.dirname, "../tokens")

/** Brand directories under tokens/brands, default brand first. */
export function listBrands(tokensDir = TOKENS_DIR): string[] {
  const brands = readdirSync(path.join(tokensDir, "brands"), {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
  if (!brands.includes(DEFAULT_BRAND)) {
    throw new Error(
      `Default brand "${DEFAULT_BRAND}" is missing in tokens/brands`,
    )
  }
  return [DEFAULT_BRAND, ...brands.filter((brand) => brand !== DEFAULT_BRAND)]
}

/** Source files for one brand × mode, in override order (later wins). */
export function sourcesFor(
  brand: string,
  mode: Mode,
  tokensDir = TOKENS_DIR,
): string[] {
  return [
    "primitive/palette.json",
    "semantic/base.json",
    `semantic/color.${mode}.json`,
    `brands/${brand}/base.json`,
    `brands/${brand}/color.${mode}.json`,
  ]
    .map((file) => path.join(tokensDir, file))
    .filter((file) => existsSync(file))
}
