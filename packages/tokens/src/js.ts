import { themeVarFor } from "./css.ts"
import { HEADER } from "./header.ts"
import type { ResolvedToken } from "./resolve.ts"

export type TokenTree = { [key: string]: string | TokenTree }

/** Nested object of public tokens; leaves are CSS variable references. */
export function tokensTree(tokens: ResolvedToken[]): TokenTree {
  const tree: TokenTree = {}
  for (const token of tokens) {
    if (themeVarFor(token.path) === undefined) continue
    const leaf = token.path[token.path.length - 1]
    if (leaf === undefined) continue
    let node = tree
    for (const key of token.path.slice(0, -1)) {
      const next = node[key]
      if (typeof next === "object") {
        node = next
      } else {
        const created: TokenTree = {}
        node[key] = created
        node = created
      }
    }
    node[leaf] = `var(${token.name})`
  }
  return tree
}

export function tokensModule(
  tokens: ResolvedToken[],
  brands: string[],
): { js: string; dts: string } {
  const tree = JSON.stringify(tokensTree(tokens), null, 2)
  const brandList = JSON.stringify(brands)
  return {
    js: `${HEADER}export const brands = ${brandList};\nexport const tokens = ${tree};\n`,
    dts: `${HEADER}export declare const brands: readonly ${brandList};\nexport declare const tokens: ${tree};\n`,
  }
}
