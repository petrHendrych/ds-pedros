import StyleDictionary from "style-dictionary"
import { sourcesFor, type Mode } from "./sources.ts"

export interface ResolvedToken {
  /** CSS custom property, e.g. "--ds-color-primary". */
  name: string
  /** DTCG path, e.g. ["color", "primary"]. */
  path: string[]
  /** CSS-ready value, e.g. "oklch(0.205 0 0)". */
  value: string
}

export async function resolveTokens(
  brand: string,
  mode: Mode,
  tokensDir?: string,
): Promise<ResolvedToken[]> {
  const sd = new StyleDictionary({
    source: sourcesFor(brand, mode, tokensDir),
    // Brand files intentionally override semantic defaults; collisions are the mechanism.
    log: { warnings: "disabled", verbosity: "silent" },
    platforms: { css: { transformGroup: "css", prefix: "ds" } },
  })
  const { allTokens } = await sd.getPlatformTokens("css")
  return allTokens.map((token) => ({
    name: `--${token.name}`,
    path: token.path,
    value: String(token.$value ?? token.value),
  }))
}
