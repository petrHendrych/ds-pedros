import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { brandCss, themeCss } from "../src/css.ts"
import { tokensModule } from "../src/js.ts"
import { resolveTokens } from "../src/resolve.ts"
import { DEFAULT_BRAND, listBrands } from "../src/sources.ts"

const dist = path.resolve(import.meta.dirname, "../dist")
rmSync(dist, { recursive: true, force: true })
mkdirSync(path.join(dist, "brands"), { recursive: true })

const brands = listBrands()
for (const brand of brands) {
  const [light, dark] = await Promise.all([
    resolveTokens(brand, "light"),
    resolveTokens(brand, "dark"),
  ])
  writeFileSync(
    path.join(dist, "brands", `${brand}.css`),
    brandCss(light, dark),
  )
}

const reference = await resolveTokens(DEFAULT_BRAND, "light")
writeFileSync(path.join(dist, "theme.css"), themeCss(reference))
const { js, dts } = tokensModule(reference, brands)
writeFileSync(path.join(dist, "index.js"), js)
writeFileSync(path.join(dist, "index.d.ts"), dts)

console.log(`@acme/tokens: built ${brands.length} brands into dist/`)
