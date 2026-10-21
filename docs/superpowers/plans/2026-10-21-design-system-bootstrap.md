# Design System Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Vite template into a working pnpm monorepo with `@acme/tokens` (DTCG → CSS/Tailwind/TS, two brands, light/dark), `@acme/ui` (Storybook, Vitest, a11y gates, lint rules, first owned shadcn component), Playwright visual regression, GitHub Actions and Changesets.

**Architecture:** `packages/tokens` compiles W3C DTCG JSON with Style Dictionary into one CSS file per brand (CSS variables prefixed `--ds-`, light on `:root`, dark via `[data-theme="dark"]` and `prefers-color-scheme`), a Tailwind v4 `theme.css` that maps Tailwind namespaces onto those variables (and removes Tailwind's default palette), and a TS module of variable references. `packages/ui` consumes it: Storybook is the workbench and test harness (stories = test cases via `@storybook/addon-vitest`), Playwright screenshots the built Storybook in a tiered matrix, tsdown builds the library preserving `"use client"`.

**Tech Stack:** pnpm 10 workspaces, Node 24, TypeScript 6, React 19, Tailwind CSS 4.3, Style Dictionary 5, shadcn CLI 4 (radix-nova style) + Radix UI, Storybook 10.6, Vitest 5, Playwright 1.64.1, ESLint 10 (+ better-tailwindcss, jsx-a11y-x, storybook), Prettier 3, tsdown, Changesets 2, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-21-design-system-foundation-design.md` (plus `README.md` and `CLAUDE.md`, which this plan updates in Task 11).

## Global Constraints

- Node 24 (`.nvmrc` = `24`); `packageManager` = `pnpm@10.29.2` (the locally installed pnpm).
- TypeScript stays `~6.0.3` (TS 7 is out but not adopted in this plan).
- Playwright is pinned **exactly** `1.64.1` (`playwright` and `@playwright/test`) so it matches the CI image `mcr.microsoft.com/playwright:v1.64.1-noble`.
- Package names: `@acme/tokens`, `@acme/ui` (placeholder scope). All token CSS variables are prefixed `--ds-`.
- Semantic color names = shadcn vocabulary (`background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `destructive`, `destructive-foreground`, `border`, `input`, `ring`) plus `success`, `warning`, `info` (each with `-foreground`).
- Brands: `acme` (default, neutral, Inter) and `nova` (violet primary, larger radius, Geist).
- Components use semantic token utilities only: no Tailwind arbitrary values (`bg-[#fff]`), no CSS-variable shorthands (`bg-(--x)`), no physical inline-axis utilities (`ml-`, `pr-`, `left-`, `text-left`). Relative imports inside packages (no `@/` alias in code).
- Interactive components start with `"use client"` (a header comment may precede it); no DOM access at module scope.
- Responsive: Tailwind default breakpoints (sm 640, md 768, lg 1024, xl 1280, 2xl 1536); VR widths 360 / 768 / 1280 / 1536; spacing base 4px (Tailwind's default `--spacing: 0.25rem`); touch target `2.75rem` (44px) on `pointer: coarse`.
- WCAG 2.2 AA: text pairs ≥ 4.5:1, non-text UI (input borders, focus ring) ≥ 3:1.
- Visual baselines: only `packages/ui/tests/visual/__screenshots__/linux/**` is committed and it is produced by CI. `darwin`/`win32` baselines are local-only and gitignored. No Docker needed locally.
- Before every commit: run `pnpm format`. Commit messages use Conventional Commits and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Work on branch `bootstrap/design-system` (created in Task 1); never push, tag or publish.

## Review Focus

1. **A Next.js RSC app imports `Button` from `@acme/ui`.** Expect the built `dist/components/button/button.js` to still start with `"use client"` and `dist/lib/cn.js` to stay server-safe. Pinned by `scripts/verify-dist.ts` (Task 7).
2. **A page sets `data-theme="light"` while the OS prefers dark.** Expect light tokens (explicit choice wins). Pinned by the `:root:not([data-theme="light"])` assertion in `brand-css.test.ts` (Task 2).
3. **A long button label inside a 240px column on a 360px phone.** Expect the label to wrap and the button to grow in height, never overflow. Pinned by the `LongLabel` story play test (Task 6).
4. **A touch device (`pointer: coarse`).** Expect every button's hit area ≥ 44×44px. Pinned by `touch-target.spec.ts` in the mobile Playwright profiles (Task 8).
5. **Windows forced-colors / high-contrast mode, keyboard user.** Expect a visible focus indicator (outline, not box-shadow). Pinned by `focus-indicator.spec.ts` with `forcedColors: "active"` (Task 8).

---

## File Structure

```
.
├── package.json                 root scripts, shared dev tooling (eslint, prettier, typescript, changesets)
├── pnpm-workspace.yaml
├── tsconfig.base.json           shared compiler options
├── eslint.config.js             all lint rules incl. design-system guardrails
├── .prettierrc.json / .prettierignore
├── .nvmrc
├── .changeset/                  config.json + changeset files
├── .github/workflows/           ci.yml, visual.yml, storybook.yml, release.yml
└── packages/
    ├── tokens/                  @acme/tokens
    │   ├── tokens/primitive/palette.json
    │   ├── tokens/semantic/{base,color.light,color.dark}.json
    │   ├── tokens/brands/{acme,nova}/*.json
    │   ├── src/sources.ts       which JSON files make up a brand × mode
    │   ├── src/resolve.ts       Style Dictionary → ResolvedToken[]
    │   ├── src/header.ts        "generated" banner
    │   ├── src/css.ts           brandCss(), themeCss(), themeVarFor()
    │   ├── src/js.ts            tokensTree(), tokensModule()
    │   ├── scripts/build.ts     writes dist/
    │   └── test/*.test.ts
    └── ui/                      @acme/ui
        ├── .storybook/{main.ts,preview.tsx,preview.css}
        ├── components.json      shadcn CLI config (for `add --diff` / `view`)
        ├── src/index.ts         public API
        ├── src/lib/cn.ts (+ cn.test.ts)
        ├── src/foundations/colors.stories.tsx
        ├── src/components/button/{button.tsx,button.stories.tsx,button.mdx}
        ├── test/lint-rules.test.ts
        ├── tests/visual/{matrix.ts,matrix.test.ts,stories.ts,stories.test.ts,visual.spec.ts,touch-target.spec.ts,focus-indicator.spec.ts}
        ├── scripts/verify-dist.ts
        ├── vite.config.ts       Vite + Vitest projects (unit, storybook)
        ├── tsdown.config.ts
        └── playwright.config.ts
```

---

### Task 1: pnpm monorepo skeleton

**Files:**

- Delete: `src/`, `public/`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `package-lock.json`
- Create: `pnpm-workspace.yaml`, `tsconfig.base.json`, `.nvmrc`, `.prettierrc.json`, `.prettierignore`
- Modify: `package.json` (full rewrite), `eslint.config.js` (full rewrite), `.gitignore`

**Interfaces:**

- Produces: root scripts `build`, `lint`, `format`, `format:check`, `typecheck`, `test`; `tsconfig.base.json` that packages extend.

- [ ] **Step 1: Branch**

```bash
git branch -m master main
git switch -c bootstrap/design-system
```

- [ ] **Step 2: Remove the template app**

```bash
git rm -r -q src public index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json package-lock.json
rm -rf node_modules
```

- [ ] **Step 3: Write `package.json`**

```json
{
  "name": "acme-design-system",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.29.2",
  "engines": {
    "node": ">=24"
  },
  "scripts": {
    "build": "pnpm -r build",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@types/node": "^24.19.2",
    "eslint": "^10.13.0",
    "eslint-config-prettier": "^10.1.8",
    "globals": "^17.13.0",
    "prettier": "^3.9.10",
    "prettier-plugin-tailwindcss": "^0.8.1",
    "typescript": "~6.0.3",
    "typescript-eslint": "^8.72.0"
  }
}
```

- [ ] **Step 4: Write workspace and shared config files**

`pnpm-workspace.yaml`:

```yaml
packages:
  - packages/*

onlyBuiltDependencies:
  - esbuild
```

`.nvmrc`:

```
24
```

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "es2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  }
}
```

`.prettierrc.json`:

```json
{
  "semi": false,
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindFunctions": ["cva", "cn"]
}
```

`.prettierignore`:

```
pnpm-lock.yaml
**/dist
**/storybook-static
**/playwright-report
**/test-results
**/__screenshots__
.idea
```

- [ ] **Step 5: Rewrite `eslint.config.js` (base; extended in Task 5)**

```js
import js from "@eslint/js"
import prettier from "eslint-config-prettier/flat"
import { defineConfig, globalIgnores } from "eslint/config"
import globals from "globals"
import tseslint from "typescript-eslint"

export default defineConfig([
  globalIgnores([
    "**/dist",
    "**/storybook-static",
    "**/playwright-report",
    "**/test-results",
  ]),
  {
    files: ["**/*.{js,ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  prettier,
])
```

- [ ] **Step 6: Extend `.gitignore`** — append:

```
# design system
storybook-static
playwright-report
test-results
*.tsbuildinfo
debug-storybook.log
# visual baselines: only CI-generated linux baselines are committed
packages/ui/tests/visual/__screenshots__/darwin/
packages/ui/tests/visual/__screenshots__/win32/
```

- [ ] **Step 7: Install and verify**

Run: `pnpm install && pnpm lint && pnpm format && pnpm format:check`
Expected: install succeeds (warning "No projects found" for `packages/*` is fine), lint exits 0, format:check reports "All matched files use Prettier code style!".

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: convert template to pnpm monorepo skeleton

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `@acme/tokens` — DTCG sources and build

**Files:**

- Create: `packages/tokens/package.json`, `packages/tokens/tsconfig.json`
- Create: `packages/tokens/tokens/primitive/palette.json`, `tokens/semantic/base.json`, `tokens/semantic/color.light.json`, `tokens/semantic/color.dark.json`, `tokens/brands/acme/base.json`, `tokens/brands/nova/base.json`, `tokens/brands/nova/color.light.json`, `tokens/brands/nova/color.dark.json`
- Create: `packages/tokens/src/{sources,resolve,header,css,js}.ts`, `packages/tokens/scripts/build.ts`
- Test: `packages/tokens/test/{brand-css,parity,contrast,theme,js}.test.ts`
- Modify: root `package.json` (scripts `postinstall`, `tokens:build`)

**Interfaces:**

- Produces (TS, used by later tests in this package only):
  - `type Mode = "light" | "dark"`, `MODES: readonly ["light","dark"]`, `DEFAULT_BRAND = "acme"`, `listBrands(tokensDir?): string[]` (default brand first), `sourcesFor(brand, mode, tokensDir?): string[]`
  - `interface ResolvedToken { name: string /* "--ds-color-primary" */; path: string[]; value: string }`, `resolveTokens(brand, mode, tokensDir?): Promise<ResolvedToken[]>`
  - `brandCss(light: ResolvedToken[], dark: ResolvedToken[]): string`, `themeCss(tokens): string`, `themeVarFor(path: string[]): string | undefined`
  - `tokensTree(tokens): TokenTree`, `tokensModule(tokens, brands): { js: string; dts: string }`
- Produces (package outputs, used by `@acme/ui`):
  - `@acme/tokens/brands/acme.css`, `@acme/tokens/brands/nova.css`
  - `@acme/tokens/theme.css` (Tailwind `@custom-variant dark`, `@theme inline` mappings, base layer)
  - `@acme/tokens` JS: `brands: readonly ["acme","nova"]`, `tokens: { color: {...}, radius: {...}, font: {...}, size: { control: { sm, md, lg }, touch } }` — leaves are `"var(--ds-…)"` strings.
- Tailwind utilities that exist after this task: `bg-/text-/border-/ring-/outline-<semantic color>`, `rounded-{sm,md,lg,xl}`, `font-{sans,mono}`, spacing names `control-sm|md|lg` and `touch` (e.g. `min-h-control-md`, `size-control-sm`, `min-h-touch`).

- [ ] **Step 1: Package manifest and tsconfig**

`packages/tokens/package.json`:

```json
{
  "name": "@acme/tokens",
  "version": "0.0.0",
  "type": "module",
  "description": "Acme design tokens (W3C DTCG) compiled to brand CSS variables, a Tailwind v4 theme and TS constants.",
  "files": ["dist"],
  "sideEffects": ["*.css"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./theme.css": "./dist/theme.css",
    "./brands/*.css": "./dist/brands/*.css",
    "./package.json": "./package.json"
  },
  "publishConfig": {
    "access": "restricted"
  },
  "scripts": {
    "build": "node scripts/build.ts",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "@types/culori": "^4.0.1",
    "@types/node": "^24.19.2",
    "culori": "^4.0.2",
    "style-dictionary": "^5.7.0",
    "typescript": "~6.0.3",
    "vitest": "^5.0.5"
  }
}
```

`packages/tokens/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2023"],
    "types": ["node"],
    "noEmit": true,
    "allowImportingTsExtensions": true
  },
  "include": ["src", "scripts", "test"]
}
```

Run: `pnpm install`

- [ ] **Step 2: Primitive palette** — `packages/tokens/tokens/primitive/palette.json`

```json
{
  "palette": {
    "$type": "color",
    "$description": "Primitive color ramps. Never referenced by components; semantic tokens alias these.",
    "neutral": {
      "0": { "$value": "oklch(1 0 0)" },
      "50": { "$value": "oklch(0.985 0 0)" },
      "100": { "$value": "oklch(0.97 0 0)" },
      "200": { "$value": "oklch(0.922 0 0)" },
      "300": { "$value": "oklch(0.87 0 0)" },
      "400": { "$value": "oklch(0.708 0 0)" },
      "500": { "$value": "oklch(0.556 0 0)" },
      "600": { "$value": "oklch(0.439 0 0)" },
      "700": { "$value": "oklch(0.371 0 0)" },
      "800": { "$value": "oklch(0.269 0 0)" },
      "900": { "$value": "oklch(0.205 0 0)" },
      "950": { "$value": "oklch(0.145 0 0)" }
    },
    "blue": {
      "400": { "$value": "oklch(0.707 0.165 254.624)" },
      "600": { "$value": "oklch(0.546 0.245 262.881)" }
    },
    "red": {
      "400": { "$value": "oklch(0.704 0.191 22.216)" },
      "600": { "$value": "oklch(0.577 0.245 27.325)" }
    },
    "green": {
      "400": { "$value": "oklch(0.792 0.209 151.711)" },
      "700": { "$value": "oklch(0.527 0.154 150.069)" }
    },
    "amber": {
      "400": { "$value": "oklch(0.828 0.189 84.429)" }
    },
    "violet": {
      "400": { "$value": "oklch(0.702 0.183 293.541)" },
      "600": { "$value": "oklch(0.541 0.281 293.009)" }
    }
  }
}
```

- [ ] **Step 3: Semantic tokens**

`packages/tokens/tokens/semantic/base.json`:

```json
{
  "radius": {
    "$type": "dimension",
    "sm": { "$value": { "value": 0.25, "unit": "rem" } },
    "md": { "$value": { "value": 0.375, "unit": "rem" } },
    "lg": { "$value": { "value": 0.5, "unit": "rem" } },
    "xl": { "$value": { "value": 0.75, "unit": "rem" } }
  },
  "font": {
    "$type": "fontFamily",
    "sans": { "$value": ["system-ui", "sans-serif"] },
    "mono": { "$value": ["ui-monospace", "SFMono-Regular", "monospace"] }
  },
  "size": {
    "$type": "dimension",
    "control": {
      "sm": { "$value": { "value": 2, "unit": "rem" } },
      "md": { "$value": { "value": 2.5, "unit": "rem" } },
      "lg": { "$value": { "value": 3, "unit": "rem" } }
    },
    "touch": {
      "$value": { "value": 2.75, "unit": "rem" },
      "$description": "Minimum 44px target on coarse pointers."
    }
  }
}
```

`packages/tokens/tokens/semantic/color.light.json`:

```json
{
  "color": {
    "$type": "color",
    "background": { "$value": "{palette.neutral.0}" },
    "foreground": { "$value": "{palette.neutral.950}" },
    "card": { "$value": "{palette.neutral.0}" },
    "card-foreground": { "$value": "{palette.neutral.950}" },
    "popover": { "$value": "{palette.neutral.0}" },
    "popover-foreground": { "$value": "{palette.neutral.950}" },
    "primary": { "$value": "{palette.neutral.900}" },
    "primary-foreground": { "$value": "{palette.neutral.50}" },
    "secondary": { "$value": "{palette.neutral.100}" },
    "secondary-foreground": { "$value": "{palette.neutral.900}" },
    "muted": { "$value": "{palette.neutral.100}" },
    "muted-foreground": { "$value": "{palette.neutral.600}" },
    "accent": { "$value": "{palette.neutral.100}" },
    "accent-foreground": { "$value": "{palette.neutral.900}" },
    "destructive": { "$value": "{palette.red.600}" },
    "destructive-foreground": { "$value": "{palette.neutral.0}" },
    "success": { "$value": "{palette.green.700}" },
    "success-foreground": { "$value": "{palette.neutral.0}" },
    "warning": { "$value": "{palette.amber.400}" },
    "warning-foreground": { "$value": "{palette.neutral.950}" },
    "info": { "$value": "{palette.blue.600}" },
    "info-foreground": { "$value": "{palette.neutral.0}" },
    "border": { "$value": "{palette.neutral.200}" },
    "input": { "$value": "{palette.neutral.500}" },
    "ring": { "$value": "{palette.blue.600}" }
  }
}
```

`packages/tokens/tokens/semantic/color.dark.json`:

```json
{
  "color": {
    "$type": "color",
    "background": { "$value": "{palette.neutral.950}" },
    "foreground": { "$value": "{palette.neutral.50}" },
    "card": { "$value": "{palette.neutral.900}" },
    "card-foreground": { "$value": "{palette.neutral.50}" },
    "popover": { "$value": "{palette.neutral.900}" },
    "popover-foreground": { "$value": "{palette.neutral.50}" },
    "primary": { "$value": "{palette.neutral.200}" },
    "primary-foreground": { "$value": "{palette.neutral.900}" },
    "secondary": { "$value": "{palette.neutral.800}" },
    "secondary-foreground": { "$value": "{palette.neutral.50}" },
    "muted": { "$value": "{palette.neutral.800}" },
    "muted-foreground": { "$value": "{palette.neutral.400}" },
    "accent": { "$value": "{palette.neutral.800}" },
    "accent-foreground": { "$value": "{palette.neutral.50}" },
    "destructive": { "$value": "{palette.red.400}" },
    "destructive-foreground": { "$value": "{palette.neutral.950}" },
    "success": { "$value": "{palette.green.400}" },
    "success-foreground": { "$value": "{palette.neutral.950}" },
    "warning": { "$value": "{palette.amber.400}" },
    "warning-foreground": { "$value": "{palette.neutral.950}" },
    "info": { "$value": "{palette.blue.400}" },
    "info-foreground": { "$value": "{palette.neutral.950}" },
    "border": { "$value": "{palette.neutral.800}" },
    "input": { "$value": "{palette.neutral.500}" },
    "ring": { "$value": "{palette.blue.400}" }
  }
}
```

- [ ] **Step 4: Brand overrides**

`packages/tokens/tokens/brands/acme/base.json`:

```json
{
  "font": {
    "$type": "fontFamily",
    "sans": { "$value": ["Inter Variable", "system-ui", "sans-serif"] }
  }
}
```

`packages/tokens/tokens/brands/nova/base.json`:

```json
{
  "font": {
    "$type": "fontFamily",
    "sans": { "$value": ["Geist Variable", "system-ui", "sans-serif"] }
  },
  "radius": {
    "$type": "dimension",
    "sm": { "$value": { "value": 0.375, "unit": "rem" } },
    "md": { "$value": { "value": 0.5, "unit": "rem" } },
    "lg": { "$value": { "value": 0.75, "unit": "rem" } },
    "xl": { "$value": { "value": 1, "unit": "rem" } }
  }
}
```

`packages/tokens/tokens/brands/nova/color.light.json`:

```json
{
  "color": {
    "$type": "color",
    "primary": { "$value": "{palette.violet.600}" },
    "primary-foreground": { "$value": "{palette.neutral.0}" },
    "ring": { "$value": "{palette.violet.600}" }
  }
}
```

`packages/tokens/tokens/brands/nova/color.dark.json`:

```json
{
  "color": {
    "$type": "color",
    "primary": { "$value": "{palette.violet.400}" },
    "primary-foreground": { "$value": "{palette.neutral.950}" },
    "ring": { "$value": "{palette.violet.400}" }
  }
}
```

- [ ] **Step 5: Write the failing tests**

`packages/tokens/test/brand-css.test.ts`:

```ts
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
```

`packages/tokens/test/parity.test.ts`:

```ts
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
```

`packages/tokens/test/contrast.test.ts`:

```ts
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
```

`packages/tokens/test/theme.test.ts`:

```ts
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
})
```

`packages/tokens/test/js.test.ts`:

```ts
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
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `pnpm --filter @acme/tokens test`
Expected: FAIL — `Failed to load url ../src/css.ts` (modules do not exist yet).

- [ ] **Step 7: Implement `src/`**

`packages/tokens/src/sources.ts`:

```ts
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
```

`packages/tokens/src/resolve.ts`:

```ts
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
```

`packages/tokens/src/header.ts`:

```ts
export const HEADER =
  "/* Generated by @acme/tokens. Do not edit: change tokens/**/*.json and run `pnpm tokens:build`. */\n"
```

`packages/tokens/src/css.ts`:

```ts
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
  *,
  ::before,
  ::after {
    border-color: var(--color-border);
  }
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
  }
}
`
}
```

`packages/tokens/src/js.ts`:

```ts
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
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `pnpm --filter @acme/tokens test`
Expected: PASS — 5 files. If a contrast case fails, fix the token alias in the semantic/brand JSON (pick a darker/lighter stop that exists in `palette.json`, adding the stop to the palette if needed). Never lower the threshold.

- [ ] **Step 9: Build script** — `packages/tokens/scripts/build.ts`

```ts
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
```

- [ ] **Step 10: Root scripts** — in root `package.json` `scripts`, add:

```json
"postinstall": "pnpm tokens:build",
"tokens:build": "pnpm --filter @acme/tokens build",
```

and change `"test"` to `"pnpm tokens:build && pnpm -r test"`.

- [ ] **Step 11: Build and inspect**

Run: `pnpm tokens:build && ls packages/tokens/dist packages/tokens/dist/brands && head -20 packages/tokens/dist/brands/nova.css && pnpm --filter @acme/tokens typecheck`
Expected: `brands/acme.css brands/nova.css index.d.ts index.js theme.css`; `nova.css` starts with the header and `:root,\n[data-theme="light"] {` with `color-scheme: light;`; typecheck exits 0.

- [ ] **Step 12: Commit**

```bash
pnpm format
git add -A
git commit -m "feat(tokens): DTCG token sources and Style Dictionary build for acme and nova

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `@acme/ui` scaffold and token-aware `cn()`

**Files:**

- Create: `packages/ui/package.json`, `packages/ui/tsconfig.json`, `packages/ui/vite.config.ts`, `packages/ui/src/index.ts`, `packages/ui/src/lib/cn.ts`
- Test: `packages/ui/src/lib/cn.test.ts`

**Interfaces:**

- Consumes: `tokens` from `@acme/tokens` (`tokens.size` subtree).
- Produces: `cn(...inputs: ClassValue[]): string` exported from `packages/ui/src/lib/cn.ts` and from `@acme/ui`. Vitest project `unit` (node) including `src/**/*.test.ts`, `test/**/*.test.ts`, `tests/**/*.test.ts`.

- [ ] **Step 1: Manifest, tsconfig, Vite config**

`packages/ui/package.json`:

```json
{
  "name": "@acme/ui",
  "version": "0.0.0",
  "type": "module",
  "description": "Acme React components: owned shadcn/ui on Radix, styled with @acme/tokens.",
  "files": ["dist"],
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./package.json": "./package.json"
  },
  "publishConfig": {
    "access": "restricted"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "@acme/tokens": "workspace:^",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.7.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@types/node": "^24.19.2",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@vitejs/plugin-react": "^6.1.2",
    "react": "^19.3.1",
    "react-dom": "^19.3.1",
    "tailwindcss": "^4.3.3",
    "typescript": "~6.0.3",
    "vite": "^8.3.5",
    "vitest": "^5.0.5"
  }
}
```

`packages/ui/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["vite/client", "node"]
  },
  "include": ["src", "test", "tests", "scripts", ".storybook", "*.ts"]
}
```

`packages/ui/vite.config.ts`:

```ts
/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: [
            "src/**/*.test.ts",
            "test/**/*.test.ts",
            "tests/**/*.test.ts",
          ],
        },
      },
    ],
  },
})
```

Run: `pnpm install`

- [ ] **Step 2: Write the failing test** — `packages/ui/src/lib/cn.test.ts`

```ts
import { describe, expect, it } from "vitest"
import { cn } from "./cn"

describe("cn", () => {
  it("joins conditional classes", () => {
    expect(cn("a", null, undefined, { b: false, c: true })).toBe("a c")
  })

  it("lets later token utilities win over conflicting ones", () => {
    expect(cn("bg-primary", "bg-secondary")).toBe("bg-secondary")
    expect(cn("h-8", "h-control-md")).toBe("h-control-md")
    expect(cn("min-h-control-sm", "min-h-control-lg")).toBe("min-h-control-lg")
    expect(cn("size-control-sm", "size-control-md")).toBe("size-control-md")
    expect(cn("rounded-md", "rounded-lg")).toBe("rounded-lg")
  })

  it("keeps font size and text color apart", () => {
    expect(cn("text-sm", "text-muted-foreground")).toBe(
      "text-sm text-muted-foreground",
    )
  })
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm --filter @acme/ui test`
Expected: FAIL — cannot resolve `./cn`.

- [ ] **Step 4: Implement** — `packages/ui/src/lib/cn.ts`

```ts
import { tokens } from "@acme/tokens"
import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

type TokenTree = { readonly [key: string]: string | TokenTree }

/** Flattens a token subtree into Tailwind suffixes: { control: { sm } } → ["control-sm"]. */
function tokenSuffixes(tree: TokenTree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const name = prefix ? `${prefix}-${key}` : key
    return typeof value === "string" ? [name] : tokenSuffixes(value, name)
  })
}

// Teach tailwind-merge our custom spacing names so `h-8 h-control-md` resolves to one class.
const twMerge = extendTailwindMerge({
  extend: { theme: { spacing: tokenSuffixes(tokens.size) } },
})

/** Merges class names; on Tailwind conflicts the later class wins. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

`packages/ui/src/index.ts`:

```ts
export { cn } from "./lib/cn"
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm --filter @acme/ui test && pnpm --filter @acme/ui typecheck`
Expected: PASS (3 tests); typecheck exits 0.

- [ ] **Step 6: Commit**

```bash
pnpm format
git add -A
git commit -m "feat(ui): scaffold @acme/ui with token-aware cn()

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Storybook workbench (brands, themes, RTL, viewports, a11y gate)

**Files:**

- Create: `packages/ui/.storybook/main.ts`, `packages/ui/.storybook/preview.tsx`, `packages/ui/.storybook/preview.css`
- Create: `packages/ui/src/foundations/colors.stories.tsx`
- Modify: `packages/ui/vite.config.ts` (add `storybook` Vitest project), `packages/ui/package.json` (scripts + devDeps), root `package.json` (`storybook` script), `.prettierrc.json` (`tailwindStylesheet`)

**Interfaces:**

- Consumes: `@acme/tokens/brands/*.css`, `@acme/tokens/theme.css`, `tokens` from `@acme/tokens`.
- Produces: Storybook globals `brand` (`"acme" | "nova"`), `theme` (`"light" | "dark"`), `dir` (`"ltr" | "rtl"`), settable per story via `globals: {...}` and per URL via `&globals=brand:nova;theme:dark`. Every story renders inside `<div data-ds-scope data-theme dir lang class="bg-background text-foreground">`. In `viewMode === "story"` the decorator also sets `data-theme` and `dir` on `<html>` (so portals inherit). Tailwind entry for the package: `packages/ui/.storybook/preview.css`. Vitest project `storybook` runs every story's `play` + axe (`a11y.test = "error"`).

- [ ] **Step 1: Install Storybook, fonts and browser tooling**

```bash
pnpm --filter @acme/ui add -D storybook@^10.6.3 @storybook/react-vite@^10.6.3 @storybook/addon-docs@^10.6.3 @storybook/addon-a11y@^10.6.3 @storybook/addon-vitest@^10.6.3 @vitest/browser-playwright@^5.0.5 @fontsource-variable/inter@^5.3.0 @fontsource-variable/geist@^5.3.0
pnpm --filter @acme/ui add -D -E playwright@1.64.1
pnpm --filter @acme/ui exec playwright install chromium
```

- [ ] **Step 2: Storybook config**

`packages/ui/.storybook/main.ts`:

```ts
import type { StorybookConfig } from "@storybook/react-vite"

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  framework: "@storybook/react-vite",
  core: { disableTelemetry: true },
}

export default config
```

`packages/ui/.storybook/preview.css`:

```css
@import "tailwindcss";
@import "@acme/tokens/theme.css";

@source "../src";
```

`packages/ui/.storybook/preview.tsx`:

```tsx
import "@fontsource-variable/inter"
import "@fontsource-variable/geist"
import "./preview.css"

import acmeCss from "@acme/tokens/brands/acme.css?inline"
import novaCss from "@acme/tokens/brands/nova.css?inline"
import type { Decorator, Preview } from "@storybook/react-vite"

const BRAND_CSS = { acme: acmeCss, nova: novaCss }
type Brand = keyof typeof BRAND_CSS

const isBrand = (value: unknown): value is Brand =>
  typeof value === "string" && value in BRAND_CSS

/** Brands are separate stylesheets in production, so only one is active at a time here too. */
function applyBrandStylesheet(brand: Brand): void {
  let style = document.querySelector<HTMLStyleElement>("style[data-ds-brand]")
  if (!style) {
    style = document.createElement("style")
    style.dataset.dsBrand = ""
    document.head.append(style)
  }
  if (style.dataset.dsBrand !== brand) {
    style.dataset.dsBrand = brand
    style.textContent = BRAND_CSS[brand]
  }
}

const withDesignSystem: Decorator = (Story, context) => {
  const brand = isBrand(context.globals.brand) ? context.globals.brand : "acme"
  const theme = context.globals.theme === "dark" ? "dark" : "light"
  const dir = context.globals.dir === "rtl" ? "rtl" : "ltr"
  applyBrandStylesheet(brand)
  if (context.viewMode === "story") {
    // Portals (dialogs, popovers) render outside the scope div and read the theme from <html>.
    document.documentElement.dataset.theme = theme
    document.documentElement.dir = dir
  }
  return (
    <div
      data-ds-scope=""
      data-theme={theme}
      dir={dir}
      lang={dir === "rtl" ? "ar" : "en"}
      className="bg-background text-foreground"
    >
      <Story />
    </div>
  )
}

const preview: Preview = {
  decorators: [withDesignSystem],
  globalTypes: {
    brand: {
      description: "Brand",
      toolbar: {
        title: "Brand",
        icon: "paintbrush",
        items: [
          { value: "acme", title: "Acme" },
          { value: "nova", title: "Nova" },
        ],
        dynamicTitle: true,
      },
    },
    theme: {
      description: "Color theme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
    dir: {
      description: "Text direction",
      toolbar: {
        title: "Direction",
        icon: "transfer",
        items: [
          { value: "ltr", title: "LTR" },
          { value: "rtl", title: "RTL" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { brand: "acme", theme: "light", dir: "ltr" },
  parameters: {
    layout: "padded",
    a11y: { test: "error" },
    viewport: {
      options: {
        mobile: {
          name: "Mobile 360",
          styles: { width: "360px", height: "780px" },
          type: "mobile",
        },
        tablet: {
          name: "Tablet 768",
          styles: { width: "768px", height: "1024px" },
          type: "tablet",
        },
        desktop: {
          name: "Desktop 1280",
          styles: { width: "1280px", height: "800px" },
          type: "desktop",
        },
        wide: {
          name: "Wide 1536",
          styles: { width: "1536px", height: "900px" },
          type: "desktop",
        },
      },
    },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
  },
}

export default preview
```

- [ ] **Step 3: Add the Storybook Vitest project** — replace `packages/ui/vite.config.ts`:

```ts
/// <reference types="vitest/config" />
import path from "node:path"
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { playwright } from "@vitest/browser-playwright"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: [
            "src/**/*.test.ts",
            "test/**/*.test.ts",
            "tests/**/*.test.ts",
          ],
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(import.meta.dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
})
```

- [ ] **Step 4: Write the failing story tests** — `packages/ui/src/foundations/colors.stories.tsx`

```tsx
import { tokens } from "@acme/tokens"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"

const colorNames = Object.keys(tokens.color) as Array<keyof typeof tokens.color>

function ColorSwatches() {
  return (
    <div className="@container">
      <ul className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @3xl:grid-cols-4">
        {colorNames.map((name) => (
          <li key={name} className="flex items-center gap-3">
            <span
              aria-hidden
              className="size-control-lg shrink-0 rounded-md border"
              style={{ backgroundColor: tokens.color[name] }}
            />
            <code className="font-mono text-sm">{name}</code>
          </li>
        ))}
      </ul>
    </div>
  )
}

function scope(canvasElement: HTMLElement): HTMLElement {
  const element = canvasElement.querySelector<HTMLElement>("[data-ds-scope]")
  if (!element) throw new Error("design-system decorator did not render")
  return element
}

const cssVar = (element: HTMLElement, name: string) =>
  getComputedStyle(element).getPropertyValue(name).trim()

const meta = {
  title: "Foundations/Colors",
  component: ColorSwatches,
} satisfies Meta<typeof ColorSwatches>

export default meta
type Story = StoryObj<typeof meta>

export const Light: Story = {
  play: async ({ canvasElement }) => {
    const element = scope(canvasElement)
    await expect(element).toHaveAttribute("data-theme", "light")
    await expect(cssVar(element, "--ds-color-background")).toBe("oklch(1 0 0)")
  },
}

export const Dark: Story = {
  globals: { theme: "dark" },
  play: async ({ canvasElement }) => {
    await expect(cssVar(scope(canvasElement), "--ds-color-background")).toBe(
      "oklch(0.145 0 0)",
    )
  },
}

export const NovaBrand: Story = {
  globals: { brand: "nova" },
  play: async ({ canvasElement }) => {
    await expect(cssVar(scope(canvasElement), "--ds-font-sans")).toContain(
      "Geist Variable",
    )
  },
}
```

- [ ] **Step 5: Scripts**

`packages/ui/package.json` `scripts` — add:

```json
"storybook": "storybook dev -p 6006",
"build-storybook": "storybook build --quiet -o storybook-static"
```

Root `package.json` `scripts` — add:

```json
"storybook": "pnpm tokens:build && pnpm --filter @acme/ui storybook"
```

`.prettierrc.json` — add `"tailwindStylesheet": "./packages/ui/.storybook/preview.css"`.

- [ ] **Step 6: Run to verify the stories pass**

Run: `pnpm --filter @acme/ui test`
Expected: PASS — `unit` (cn) and `storybook` (3 Colors stories incl. axe) projects. If `@acme/tokens/brands/acme.css?inline` fails to resolve, check that `pnpm tokens:build` ran (postinstall) and that `packages/tokens/package.json` exports `./brands/*.css`.

- [ ] **Step 7: Smoke-test the static build**

Run: `pnpm --filter @acme/ui build-storybook && ls packages/ui/storybook-static/index.json`
Expected: build succeeds; `index.json` exists.

- [ ] **Step 8: Commit**

```bash
pnpm format
git add -A
git commit -m "feat(ui): Storybook workbench with brand/theme/RTL globals and a11y gate

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Lint guardrails (tokens-only classes, logical properties, a11y)

**Files:**

- Modify: `eslint.config.js` (full rewrite), root `package.json` (devDeps)
- Test: `packages/ui/test/lint-rules.test.ts`

**Interfaces:**

- Consumes: Tailwind entry `packages/ui/.storybook/preview.css` (Task 4).
- Produces: ESLint rule ids used in tests and CLAUDE.md: `better-tailwindcss/no-restricted-classes` (arbitrary values, `(--var)` shorthands), `better-tailwindcss/no-unknown-classes` (non-token classes such as `bg-red-500`), `better-tailwindcss/enforce-logical-properties` (inline-axis physical classes), `jsx-a11y-x/*`, `storybook/*`.

- [ ] **Step 1: Install plugins**

```bash
pnpm add -D -w eslint-plugin-better-tailwindcss@^4.10.0 eslint-plugin-jsx-a11y-x@^0.2.0 eslint-plugin-react-hooks@^7.1.1 eslint-plugin-storybook@^10.6.3
```

- [ ] **Step 2: Write the failing test** — `packages/ui/test/lint-rules.test.ts`

```ts
import path from "node:path"
import { ESLint } from "eslint"
import { describe, expect, it } from "vitest"

const repoRoot = path.resolve(import.meta.dirname, "../../..")
const eslint = new ESLint({ cwd: repoRoot })
const fixture = path.join(
  repoRoot,
  "packages/ui/src/components/fixture/fixture.tsx",
)

async function ruleIds(code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: fixture })
  return (result?.messages ?? []).map(
    (message) => message.ruleId ?? message.message,
  )
}

const withClass = (className: string) =>
  `export function Fixture() {\n  return <div className="${className}" />\n}\n`

describe("design-system lint rules", { timeout: 30_000 }, () => {
  it("accepts semantic token utilities", async () => {
    expect(
      await ruleIds(
        withClass(
          "bg-primary text-primary-foreground ps-4 min-h-control-md rounded-md",
        ),
      ),
    ).toEqual([])
  })

  it("rejects arbitrary values", async () => {
    expect(await ruleIds(withClass("bg-[#fff]"))).toContain(
      "better-tailwindcss/no-restricted-classes",
    )
  })

  it("rejects CSS-variable shorthands", async () => {
    expect(await ruleIds(withClass("bg-(--brand)"))).toContain(
      "better-tailwindcss/no-restricted-classes",
    )
  })

  it("rejects Tailwind's default palette", async () => {
    expect(await ruleIds(withClass("bg-red-500"))).toContain(
      "better-tailwindcss/no-unknown-classes",
    )
  })

  it("rejects physical inline-direction utilities", async () => {
    expect(await ruleIds(withClass("ml-2"))).toContain(
      "better-tailwindcss/enforce-logical-properties",
    )
    expect(await ruleIds(withClass("pr-4"))).toContain(
      "better-tailwindcss/enforce-logical-properties",
    )
  })

  it("allows direction-agnostic block and sizing utilities", async () => {
    expect(
      await ruleIds(withClass("mt-2 pb-4 h-control-md w-full size-4 max-w-60")),
    ).toEqual([])
  })

  it("requires alt text on images", async () => {
    expect(
      await ruleIds(`export const Img = () => <img src="x.png" />\n`),
    ).toContain("jsx-a11y-x/alt-text")
  })
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm --filter @acme/ui exec vitest run --project unit test/lint-rules.test.ts`
Expected: FAIL — the "rejects …" cases get `[]` (rules not configured yet).

- [ ] **Step 4: Rewrite `eslint.config.js`**

```js
import path from "node:path"
import js from "@eslint/js"
import prettier from "eslint-config-prettier/flat"
import betterTailwindcss from "eslint-plugin-better-tailwindcss"
import jsxA11yX from "eslint-plugin-jsx-a11y-x"
import reactHooks from "eslint-plugin-react-hooks"
import storybook from "eslint-plugin-storybook"
import { defineConfig, globalIgnores } from "eslint/config"
import globals from "globals"
import tseslint from "typescript-eslint"

/** Block-axis and sizing utilities do not flip in RTL; only inline-axis physical classes do. */
const DIRECTION_AGNOSTIC = [
  "^(.*:)?-?(m|p|scroll-m|scroll-p)(t|b)-",
  "^(.*:)?-?(top|bottom)-",
  "^(.*:)?border-(t|b)(-|$)",
  "^(.*:)?(min-|max-)?(h|w)-",
  "^(.*:)?size-",
]

export default defineConfig([
  globalIgnores([
    "**/dist",
    "**/storybook-static",
    "**/playwright-report",
    "**/test-results",
  ]),
  {
    files: ["**/*.{js,ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ["packages/ui/**/*.tsx"],
    extends: [
      reactHooks.configs.flat.recommended,
      jsxA11yX.configs.recommended,
    ],
  },
  {
    files: ["packages/ui/src/**/*.tsx", "packages/ui/.storybook/**/*.tsx"],
    plugins: { "better-tailwindcss": betterTailwindcss },
    settings: {
      "better-tailwindcss": {
        cwd: path.join(import.meta.dirname, "packages/ui"),
        entryPoint: ".storybook/preview.css",
      },
    },
    rules: {
      "better-tailwindcss/no-unknown-classes": "error",
      "better-tailwindcss/no-conflicting-classes": "error",
      "better-tailwindcss/no-duplicate-classes": "error",
      "better-tailwindcss/no-deprecated-classes": "error",
      "better-tailwindcss/enforce-logical-properties": [
        "error",
        { ignore: DIRECTION_AGNOSTIC },
      ],
      "better-tailwindcss/no-restricted-classes": [
        "error",
        {
          restrict: [
            {
              pattern: "\\[[^\\[\\]]*\\](?!:)",
              message:
                "Arbitrary values bypass the design tokens. Use a token utility or propose a new token.",
            },
            {
              pattern: "\\(--[^)]*\\)",
              message:
                "CSS-variable shorthands bypass the design tokens. Use a token utility.",
            },
          ],
        },
      ],
    },
  },
  ...storybook.configs["flat/recommended"],
  prettier,
])
```

- [ ] **Step 5: Run to verify it passes, then lint the repo**

Run: `pnpm --filter @acme/ui exec vitest run --project unit test/lint-rules.test.ts && pnpm lint`
Expected: 7 tests PASS; `pnpm lint` exits 0 (existing `colors.stories.tsx` and `preview.tsx` comply). If `no-unknown-classes` reports token utilities as unknown, the tokens `dist/` is stale: run `pnpm tokens:build`.

- [ ] **Step 6: Commit**

```bash
pnpm format
git add -A
git commit -m "feat(lint): enforce token-only Tailwind classes, logical properties and a11y rules

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Button — first owned shadcn component

**Files:**

- Create: `packages/ui/components.json`
- Create: `packages/ui/src/components/button/button.tsx`, `button.stories.tsx`, `button.mdx`
- Modify: `packages/ui/src/index.ts`, `packages/ui/tsconfig.json` (`paths` for the shadcn CLI), `packages/ui/package.json` (deps)

**Interfaces:**

- Consumes: `cn` from `../../lib/cn`; Storybook globals `theme`, `dir` (Task 4); `[data-ds-scope]` wrapper.
- Produces: `Button(props: ButtonProps)`, `buttonVariants` (cva), `type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }`; variants `default | secondary | outline | ghost | destructive | link`; sizes `sm | md | lg | icon-sm | icon | icon-lg`; renders `data-slot="button"`, `data-variant`, `data-size`; default `type="button"`. Story id used by Task 8: `components-button--default`.

- [ ] **Step 1: Dependencies and shadcn CLI config**

```bash
pnpm --filter @acme/ui add class-variance-authority@^0.7.1 radix-ui@^1.8.1
pnpm --filter @acme/ui add -D lucide-react@^1.61.0
```

`packages/ui/components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": ".storybook/preview.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": true,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/cn",
    "ui": "@/components",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {}
}
```

In `packages/ui/tsconfig.json` `compilerOptions`, add (used only by the shadcn CLI to resolve aliases; source code uses relative imports):

```json
"paths": { "@/*": ["./src/*"] }
```

Reference upstream: `cd packages/ui && pnpm dlx shadcn@4.22.1 view button` — read it; the deviations listed in the header below are the differences we keep.

- [ ] **Step 2: Write the failing stories** — `packages/ui/src/components/button/button.stories.tsx`

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite"
import { ArrowRight, Plus } from "lucide-react"
import { expect, fn, userEvent } from "storybook/test"

import { Button } from "./button"

const VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const
const SIZES = ["sm", "md", "lg"] as const

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Button", onClick: fn() },
  argTypes: {
    variant: { control: "select", options: VARIANTS },
    size: {
      control: "select",
      options: [...SIZES, "icon-sm", "icon", "icon-lg"],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole("button", { name: "Button" })
    await expect(button).toHaveAttribute("type", "button")
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-4">
      {VARIANTS.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      {SIZES.map((size) => (
        <Button key={size} {...args} size={size}>
          Size {size}
        </Button>
      ))}
    </div>
  ),
}

export const WithIcon: Story = {
  args: {
    children: (
      <>
        Continue
        <ArrowRight aria-hidden className="rtl:rotate-180" />
      </>
    ),
  },
}

export const IconOnly: Story = {
  args: {
    size: "icon",
    "aria-label": "Add item",
    children: <Plus aria-hidden />,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Add item" })).toBeVisible()
  },
}

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button")).toBeDisabled()
  },
}

export const Keyboard: Story = {
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole("button")
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await userEvent.keyboard(" ")
    await expect(args.onClick).toHaveBeenCalledTimes(2)
  },
}

export const AsLink: Story = {
  render: (args) => (
    <Button {...args} asChild>
      <a href="#usage">Read the usage guide</a>
    </Button>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "Read the usage guide" })
    await expect(link).not.toHaveAttribute("type")
    await expect(link).toHaveAttribute("data-slot", "button")
  },
}

export const LongLabel: Story = {
  args: { children: "Save changes and continue to the payment details step" },
  render: (args) => (
    <div className="max-w-60">
      <Button {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button")
    // Narrow containers wrap the label instead of overflowing it.
    await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth)
    await expect(button.getBoundingClientRect().width).toBeLessThanOrEqual(240)
  },
}

export const RightToLeft: Story = {
  globals: { dir: "rtl" },
  args: {
    children: (
      <>
        متابعة
        <ArrowRight aria-hidden className="rtl:rotate-180" />
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector("[data-ds-scope]"),
    ).toHaveAttribute("dir", "rtl")
  },
}

export const Dark: Story = {
  tags: ["no-vr"],
  globals: { theme: "dark" },
  render: Variants.render,
}
```

- [ ] **Step 3: Run to verify they fail**

Run: `pnpm --filter @acme/ui exec vitest run --project storybook`
Expected: FAIL — `Failed to resolve import "./button"`.

- [ ] **Step 4: Implement** — `packages/ui/src/components/button/button.tsx`

```tsx
/**
 * Upstream: shadcn/ui `button`, style `radix-nova`, shadcn CLI 4.22.1.
 * Review upstream changes with `pnpm dlx shadcn@latest add button --diff` (never `--overwrite`).
 * Deviations:
 *  - `cn` comes from ../../lib/cn (clsx + tailwind-merge aware of our tokens), not the `cn` package
 *  - sizes are sm | md | lg | icon-sm | icon | icon-lg and use control-size tokens
 *  - labels wrap instead of overflowing (min-h + py, no whitespace-nowrap) for narrow viewports
 *  - coarse pointers get a 44px minimum target (pointer-coarse:min-h-touch / min-w-touch)
 *  - focus indicator is a 2px `ring` outline (survives forced-colors mode), not a translucent box-shadow
 *  - no `dark:` overrides and no arbitrary values: themes and brands come entirely from tokens
 *  - destructive is a solid fill with `destructive-foreground` text
 *  - `type="button"` by default so buttons never submit forms by accident
 */
"use client"

import type { ComponentProps } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "../../lib/cn"

const buttonVariants = cva(
  "pointer-coarse:min-h-touch focus-visible:outline-ring aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent text-center text-sm font-medium transition-colors outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "min-h-control-sm px-3 py-1",
        md: "min-h-control-md px-4 py-2",
        lg: "min-h-control-lg px-6 py-2 text-base",
        "icon-sm": "size-control-sm pointer-coarse:min-w-touch",
        icon: "size-control-md pointer-coarse:min-w-touch",
        "icon-lg": "size-control-lg pointer-coarse:min-w-touch",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
)

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. a link) with button styles instead of a <button>. */
    asChild?: boolean
  }

function Button({
  className,
  variant,
  size,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? "default"}
      data-size={size ?? "md"}
      type={asChild ? type : (type ?? "button")}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants, type ButtonProps }
```

`packages/ui/src/index.ts`:

```ts
export {
  Button,
  buttonVariants,
  type ButtonProps,
} from "./components/button/button"
export { cn } from "./lib/cn"
```

- [ ] **Step 5: Usage docs** — `packages/ui/src/components/button/button.mdx`

```mdx
import { Canvas, Controls, Meta } from "@storybook/addon-docs/blocks"

import * as ButtonStories from "./button.stories"

<Meta of={ButtonStories} name="Usage" />

# Button

Triggers an action in place. For navigation, render a link with `asChild`.

<Canvas of={ButtonStories.Variants} />
<Controls of={ButtonStories.Default} />

## Do

- Use one `default` button per view and pair it with `outline` or `ghost`.
- Give icon-only buttons an `aria-label`.
- Let long labels wrap; the button grows in height.
- Navigate with `<Button asChild><a href="…">…</a></Button>`.
- Change appearance through a variant or a token.

## Accessibility

| Key               | Action                    |
| ----------------- | ------------------------- |
| `Tab`             | Moves focus to the button |
| `Enter` / `Space` | Activates the button      |

- Renders a native `<button type="button">`; disabled buttons use the native `disabled` attribute.
- Focus shows a 2px `ring` outline that stays visible in forced-colors mode.
- On touch devices the target is at least 44×44px.
```

- [ ] **Step 6: Run to verify they pass**

Run: `pnpm --filter @acme/ui test && pnpm lint && pnpm typecheck`
Expected: all Button stories PASS (play + axe), Colors still pass; lint and typecheck exit 0. If `no-unknown-classes` flags `pointer-coarse:`, `size-control-*` or `outline-ring`, verify the class against `pnpm tokens:build` output rather than disabling the rule.

- [ ] **Step 7: Commit**

```bash
pnpm format
git add -A
git commit -m "feat(ui): add owned Button component with stories, docs and a11y tests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Library build that keeps `"use client"`

**Files:**

- Create: `packages/ui/tsdown.config.ts`, `packages/ui/scripts/verify-dist.ts`
- Modify: `packages/ui/package.json` (scripts `build`, `verify:dist`; devDeps), `packages/tokens/package.json` (script `verify:dist`; devDep)

**Interfaces:**

- Consumes: `src/index.ts` exports from Task 6.
- Produces: `packages/ui/dist/index.js`, `dist/index.d.ts`, `dist/components/button/button.js`, `dist/lib/cn.js` (unbundled ESM). Script `pnpm --filter @acme/ui verify:dist` exits non-zero on violations.

- [ ] **Step 1: Install**

```bash
pnpm --filter @acme/ui add -D tsdown@^0.23.1 publint@^0.3.25
pnpm --filter @acme/tokens add -D publint@^0.3.25
```

- [ ] **Step 2: Write the failing check** — `packages/ui/scripts/verify-dist.ts`

```ts
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

const dist = path.resolve(import.meta.dirname, "../dist")
const failures: string[] = []
const USE_CLIENT = /^(\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*["']use client["']/

function read(file: string): string {
  const full = path.join(dist, file)
  if (!existsSync(full)) {
    failures.push(`missing dist/${file}`)
    return ""
  }
  return readFileSync(full, "utf8")
}

const index = read("index.js")
for (const name of ["Button", "buttonVariants", "cn"]) {
  if (!new RegExp(`\\b${name}\\b`).test(index))
    failures.push(`dist/index.js does not export ${name}`)
}
if (!read("index.d.ts").includes("ButtonProps"))
  failures.push("dist/index.d.ts lacks ButtonProps")
if (!USE_CLIENT.test(read("components/button/button.js"))) {
  failures.push('dist/components/button/button.js must start with "use client"')
}
if (read("lib/cn.js").includes("use client")) {
  failures.push('dist/lib/cn.js must stay server-safe (no "use client")')
}

if (failures.length > 0) {
  console.error(failures.join("\n"))
  process.exit(1)
}
console.log("@acme/ui dist OK")
```

Add scripts to `packages/ui/package.json`:

```json
"build": "tsdown",
"verify:dist": "node scripts/verify-dist.ts && publint"
```

Add to `packages/tokens/package.json` scripts: `"verify:dist": "publint"`.

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm --filter @acme/ui verify:dist`
Expected: FAIL — `missing dist/index.js` (and the other dist files).

- [ ] **Step 4: Build config** — `packages/ui/tsdown.config.ts`

```ts
import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/index.ts"],
  // One output file per module keeps per-file "use client" directives intact.
  unbundle: true,
  format: "esm",
  platform: "neutral",
  dts: true,
  sourcemap: true,
})
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm build && pnpm --filter @acme/ui verify:dist && pnpm --filter @acme/tokens verify:dist`
Expected: build succeeds (a rolldown note "module level directive may not be preserved" is expected and harmless with `unbundle`); `@acme/ui dist OK`; publint reports no errors for both packages. Confirm dependencies are not bundled: `grep -l "tailwind-merge" packages/ui/dist/lib/cn.js` shows an `import` from `"tailwind-merge"`, not inlined code.

- [ ] **Step 6: Commit**

```bash
pnpm format
git add -A
git commit -m "build(ui): unbundled tsdown build preserving use client, with dist verification

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Playwright visual regression, touch targets and forced-colors focus

**Files:**

- Create: `packages/ui/playwright.config.ts`
- Create: `packages/ui/tests/visual/matrix.ts`, `matrix.test.ts`, `stories.ts`, `stories.test.ts`, `visual.spec.ts`, `touch-target.spec.ts`, `focus-indicator.spec.ts`
- Modify: `packages/ui/package.json` (scripts, devDeps), root `package.json` (`test:visual`)

**Interfaces:**

- Consumes: `brands` from `@acme/tokens`; `storybook-static/index.json` (Task 4 build); story id `components-button--default` (Task 6); story tag `no-vr`.
- Produces: `cellsFor(project: string, brands: readonly string[]): Cell[]`, `cellName(cell: Cell): string`, `interface Cell { brand: string; theme: "light" | "dark"; width: number | null }`, `VR_WIDTHS`, `visualStories(index: StoryIndex): IndexEntry[]`, `NO_VR_TAG = "no-vr"`. Playwright project names: `chromium`, `firefox`, `webkit`, `mobile-safari`, `mobile-chrome`. Snapshot dir: `tests/visual/__screenshots__/{platform}/{projectName}/<story-id>/<brand>-<theme>-<width|device>.png`.

- [ ] **Step 1: Install**

```bash
pnpm --filter @acme/ui add -D -E @playwright/test@1.64.1
pnpm --filter @acme/ui add -D @axe-core/playwright@^4.14.0 sirv-cli@^3.0.1
pnpm --filter @acme/ui exec playwright install chromium firefox webkit
```

- [ ] **Step 2: Write the failing unit tests**

`packages/ui/tests/visual/matrix.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { cellName, cellsFor, VR_WIDTHS } from "./matrix"

const BRANDS = ["acme", "nova"] as const

describe("visual-regression matrix", () => {
  it("tier A + C: chromium covers every width and theme for the default brand, other brands at 1280", () => {
    const cells = cellsFor("chromium", BRANDS)
    expect(cells.filter((cell) => cell.brand === "acme")).toHaveLength(
      VR_WIDTHS.length * 2,
    )
    expect(cells).toContainEqual({ brand: "acme", theme: "dark", width: 360 })
    expect(cells.filter((cell) => cell.brand === "nova")).toEqual([
      { brand: "nova", theme: "light", width: 1280 },
      { brand: "nova", theme: "dark", width: 1280 },
    ])
  })

  it("tier B: other desktop engines take 360 and 1280 in light", () => {
    for (const project of ["firefox", "webkit"]) {
      expect(cellsFor(project, BRANDS)).toEqual([
        { brand: "acme", theme: "light", width: 360 },
        { brand: "acme", theme: "light", width: 1280 },
      ])
    }
  })

  it("tier B: mobile profiles keep their device viewport", () => {
    expect(cellsFor("mobile-safari", BRANDS)).toEqual([
      { brand: "acme", theme: "light", width: null },
    ])
    expect(cellName({ brand: "acme", theme: "light", width: null })).toBe(
      "acme-light-device.png",
    )
  })

  it("refuses projects without a tier", () => {
    expect(() => cellsFor("edge", BRANDS)).toThrow(/No visual-regression tier/)
  })
})
```

`packages/ui/tests/visual/stories.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { visualStories, type StoryIndex } from "./stories"

describe("visualStories", () => {
  it("keeps stories, drops docs entries and no-vr stories, sorted by id", () => {
    const index: StoryIndex = {
      v: 5,
      entries: {
        "b--one": {
          type: "story",
          id: "b--one",
          title: "B",
          name: "One",
          tags: [],
        },
        "a--docs": {
          type: "docs",
          id: "a--docs",
          title: "A",
          name: "Docs",
          tags: [],
        },
        "a--two": { type: "story", id: "a--two", title: "A", name: "Two" },
        "a--dark": {
          type: "story",
          id: "a--dark",
          title: "A",
          name: "Dark",
          tags: ["no-vr"],
        },
      },
    }
    expect(visualStories(index).map((entry) => entry.id)).toEqual([
      "a--two",
      "b--one",
    ])
  })
})
```

Run: `pnpm --filter @acme/ui exec vitest run --project unit tests/visual`
Expected: FAIL — cannot resolve `./matrix` / `./stories`.

- [ ] **Step 3: Implement helpers**

`packages/ui/tests/visual/matrix.ts`:

```ts
export const DEFAULT_BRAND = "acme"
export const VR_WIDTHS = [360, 768, 1280, 1536] as const
const THEMES = ["light", "dark"] as const

export interface Cell {
  brand: string
  theme: (typeof THEMES)[number]
  /** null keeps the device profile's own viewport. */
  width: number | null
}

/** Tiered matrix from the spec (Q21). */
export function cellsFor(project: string, brands: readonly string[]): Cell[] {
  const otherBrands = brands.filter((brand) => brand !== DEFAULT_BRAND)
  switch (project) {
    case "chromium":
      return [
        ...VR_WIDTHS.flatMap((width) =>
          THEMES.map((theme) => ({ brand: DEFAULT_BRAND, theme, width })),
        ),
        ...otherBrands.flatMap((brand) =>
          THEMES.map((theme) => ({ brand, theme, width: 1280 })),
        ),
      ]
    case "firefox":
    case "webkit":
      return [360, 1280].map((width) => ({
        brand: DEFAULT_BRAND,
        theme: "light" as const,
        width,
      }))
    case "mobile-safari":
    case "mobile-chrome":
      return [{ brand: DEFAULT_BRAND, theme: "light", width: null }]
    default:
      throw new Error(
        `No visual-regression tier defined for project "${project}"`,
      )
  }
}

export function cellName(cell: Cell): string {
  return `${cell.brand}-${cell.theme}-${cell.width ?? "device"}.png`
}
```

`packages/ui/tests/visual/stories.ts`:

```ts
export interface IndexEntry {
  type: "story" | "docs"
  id: string
  title: string
  name: string
  tags?: string[]
}

export interface StoryIndex {
  v: number
  entries: Record<string, IndexEntry>
}

export const NO_VR_TAG = "no-vr"

export function visualStories(index: StoryIndex): IndexEntry[] {
  return Object.values(index.entries)
    .filter(
      (entry) =>
        entry.type === "story" && !(entry.tags ?? []).includes(NO_VR_TAG),
    )
    .sort((a, b) => a.id.localeCompare(b.id))
}
```

Run: `pnpm --filter @acme/ui exec vitest run --project unit tests/visual`
Expected: PASS (5 tests).

- [ ] **Step 4: Playwright config** — `packages/ui/playwright.config.ts`

```ts
import { defineConfig, devices } from "@playwright/test"

const PORT = 6008

export default defineConfig({
  testDir: "./tests/visual",
  testMatch: "**/*.spec.ts",
  // Baselines are per OS: CI commits linux/, local darwin/ and win32/ stay gitignored.
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{platform}/{projectName}/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : [["html", { open: "never" }], ["list"]],
  expect: {
    toHaveScreenshot: { animations: "disabled", caret: "hide" },
  },
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  webServer: {
    command: `pnpm exec sirv storybook-static --port ${PORT} --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/iframe.html`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 15"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],
})
```

- [ ] **Step 5: Specs**

`packages/ui/tests/visual/visual.spec.ts`:

```ts
import { readFileSync } from "node:fs"
import path from "node:path"
import { brands } from "@acme/tokens"
import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { cellName, cellsFor } from "./matrix"
import { visualStories, type StoryIndex } from "./stories"

const indexPath = path.resolve(
  import.meta.dirname,
  "../../storybook-static/index.json",
)
const stories = visualStories(
  JSON.parse(readFileSync(indexPath, "utf8")) as StoryIndex,
)
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]

for (const story of stories) {
  test(`${story.title} › ${story.name}`, async ({ page }, testInfo) => {
    for (const cell of cellsFor(testInfo.project.name, brands)) {
      if (cell.width !== null)
        await page.setViewportSize({ width: cell.width, height: 900 })
      await page.goto(
        `/iframe.html?id=${story.id}&viewMode=story&globals=brand:${cell.brand};theme:${cell.theme}`,
      )
      await page.locator("#storybook-root > *").first().waitFor()
      await page.evaluate(() => document.fonts.ready)
      await expect
        .soft(page)
        .toHaveScreenshot([story.id, cellName(cell)], { fullPage: true })

      if (testInfo.project.name === "chromium") {
        const { violations } = await new AxeBuilder({ page })
          .include("#storybook-root")
          .withTags(WCAG_TAGS)
          .analyze()
        expect.soft(violations, `${story.id} ${cellName(cell)}`).toEqual([])
      }
    }
  })
}
```

`packages/ui/tests/visual/touch-target.spec.ts`:

```ts
import { expect, test } from "@playwright/test"

test("buttons offer a 44px target on coarse pointers", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, "touch profiles only")
  await page.goto("/iframe.html?id=components-button--default&viewMode=story")
  expect(
    await page.evaluate(() => matchMedia("(pointer: coarse)").matches),
  ).toBe(true)
  const box = await page.getByRole("button", { name: "Button" }).boundingBox()
  expect(box?.height).toBeGreaterThanOrEqual(44)
})

test("icon buttons offer a 44×44px target on coarse pointers", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, "touch profiles only")
  await page.goto("/iframe.html?id=components-button--icon-only&viewMode=story")
  const box = await page.getByRole("button", { name: "Add item" }).boundingBox()
  expect(box?.height).toBeGreaterThanOrEqual(44)
  expect(box?.width).toBeGreaterThanOrEqual(44)
})
```

`packages/ui/tests/visual/focus-indicator.spec.ts`:

```ts
import { expect, test } from "@playwright/test"

for (const forcedColors of ["none", "active"] as const) {
  test(`keyboard focus shows a 2px outline (forced colors: ${forcedColors})`, async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "forced-colors emulation is Chromium-only",
    )
    await page.emulateMedia({ forcedColors })
    await page.goto("/iframe.html?id=components-button--default&viewMode=story")
    await page.keyboard.press("Tab")
    const button = page.getByRole("button", { name: "Button" })
    await expect(button).toBeFocused()
    await expect(button).toHaveCSS("outline-style", "solid")
    await expect(button).toHaveCSS("outline-width", "2px")
  })
}
```

- [ ] **Step 6: Scripts**

`packages/ui/package.json` scripts:

```json
"test:visual": "playwright test",
"test:visual:update": "playwright test --update-snapshots"
```

Root `package.json` scripts:

```json
"test:visual": "pnpm tokens:build && pnpm --filter @acme/ui build-storybook && pnpm --filter @acme/ui test:visual"
```

- [ ] **Step 7: Verify locally (darwin baselines, never committed)**

Run: `pnpm --filter @acme/ui build-storybook && pnpm --filter @acme/ui exec playwright test --update-snapshots`
Expected: first run writes `tests/visual/__screenshots__/darwin/**`; touch and focus specs PASS; axe reports no violations.

Run: `pnpm --filter @acme/ui test:visual`
Expected: PASS on all 5 projects against the local darwin baselines.

Run: `git status --short packages/ui/tests/visual`
Expected: only the `.ts` files are listed; `__screenshots__/darwin` does not appear (gitignored).

If `touch-target.spec.ts` fails on the `matchMedia("(pointer: coarse)")` assertion for one engine, stop and report it; do not weaken the assertion.

- [ ] **Step 8: Commit**

```bash
pnpm format
git add -A
git commit -m "test(visual): tiered Playwright screenshot matrix with axe, touch-target and focus checks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: GitHub Actions — CI, visual regression with CI-owned baselines, Storybook on Pages

**Files:**

- Create: `.github/workflows/ci.yml`, `.github/workflows/visual.yml`, `.github/workflows/storybook.yml`

**Interfaces:**

- Consumes: root scripts `format:check`, `lint`, `typecheck`, `test`, `build`; ui scripts `build-storybook`, `test:visual`, `test:visual:update`, `verify:dist`.
- Produces: workflow "Visual regression" with a `workflow_dispatch` boolean input `update` that regenerates and commits linux baselines to the dispatched branch.

- [ ] **Step 1: `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm format:check
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm --filter @acme/ui exec playwright install --with-deps chromium
      - run: pnpm test
      - run: pnpm build
      - run: pnpm --filter @acme/ui verify:dist
      - run: pnpm --filter @acme/tokens verify:dist
```

- [ ] **Step 2: `.github/workflows/visual.yml`**

```yaml
name: Visual regression

on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      update:
        description: Regenerate linux baselines and commit them to this branch
        type: boolean
        default: false

concurrency:
  group: visual-${{ github.ref }}
  cancel-in-progress: true

jobs:
  visual:
    runs-on: ubuntu-latest
    container:
      # Must match the exact @playwright/test version in packages/ui/package.json.
      image: mcr.microsoft.com/playwright:v1.64.1-noble
      options: --user 1001
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @acme/ui build-storybook
      - name: Compare against baselines
        if: ${{ !inputs.update }}
        run: pnpm --filter @acme/ui test:visual
      - name: Regenerate baselines
        if: ${{ inputs.update }}
        run: pnpm --filter @acme/ui test:visual:update
      - name: Commit baselines
        if: ${{ inputs.update }}
        run: |
          git config --global --add safe.directory "$GITHUB_WORKSPACE"
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add packages/ui/tests/visual/__screenshots__/linux
          if git diff --cached --quiet; then
            echo "Baselines unchanged"
          else
            git commit -m "test(visual): update linux baselines"
            git push
          fi
      - uses: actions/upload-artifact@v4
        if: ${{ failure() }}
        with:
          name: playwright-report
          path: packages/ui/playwright-report
          retention-days: 14
```

- [ ] **Step 3: `.github/workflows/storybook.yml`**

```yaml
name: Storybook

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @acme/ui build-storybook
      - uses: actions/upload-pages-artifact@v4
        with:
          path: packages/ui/storybook-static

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: Validate the workflow files**

Run: `for f in .github/workflows/*.yml; do pnpm dlx @action-validator/cli@0.6.0 "$f" || exit 1; done`
Expected: no errors for all three files. (The workflows themselves only run once the repo is on GitHub; first baselines come from dispatching "Visual regression" with `update: true` on the PR branch.)

- [ ] **Step 5: Commit**

```bash
pnpm format
git add -A
git commit -m "ci: add CI, visual regression with CI-owned baselines and Storybook Pages deploy

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Changesets versioning

**Files:**

- Create: `.changeset/config.json`, `.changeset/initial-release.md`, `.github/workflows/release.yml`
- Modify: root `package.json` (scripts, devDep)

**Interfaces:**

- Produces: root scripts `changeset`, `version-packages`; a "Release" workflow that opens/updates a "Version packages" PR on `main`. Publishing is deliberately not wired until the real npm scope exists.

- [ ] **Step 1: Install and configure**

```bash
pnpm add -D -w @changesets/cli@^2.31.1
```

`.changeset/config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

Root `package.json` scripts:

```json
"changeset": "changeset",
"version-packages": "changeset version && pnpm install --lockfile-only"
```

- [ ] **Step 2: First changeset** — `.changeset/initial-release.md`

```md
---
"@acme/tokens": minor
"@acme/ui": minor
---

Initial release: DTCG tokens for the acme and nova brands (light/dark) with a Tailwind v4 theme, and the first owned component, Button.
```

- [ ] **Step 3: Release workflow** — `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    branches: [main]

concurrency: release-${{ github.ref }}

permissions:
  contents: write
  pull-requests: write

jobs:
  version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      # Opens or updates the "Version packages" PR. Publishing is added once the real npm scope exists.
      - uses: changesets/action@v1
        with:
          version: pnpm version-packages
          commit: "chore: version packages"
          title: "chore: version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 4: Verify**

Run: `pnpm changeset status && pnpm dlx @action-validator/cli@0.6.0 .github/workflows/release.yml`
Expected: status lists `@acme/tokens` and `@acme/ui` with a minor bump; the validator reports no errors.

- [ ] **Step 5: Commit**

```bash
pnpm format
git add -A
git commit -m "chore: add Changesets with version-PR release workflow

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Bring README, CLAUDE.md and the decision record in line with what was built

**Files:**

- Modify: `README.md`, `CLAUDE.md`, `docs/superpowers/specs/2026-10-21-design-system-foundation-design.md`

**Interfaces:**

- Consumes: everything above. No code.

- [ ] **Step 1: README edits** (edit the named sections in place; keep the rest)

1. **Status banner** → "Bootstrapped: tokens, Storybook, lint guardrails, Button, visual regression, CI and Changesets are in place. `@acme` is a placeholder scope."
2. **Stack table**: Accessibility checks row → `Storybook a11y addon, @axe-core/playwright, eslint-plugin-jsx-a11y-x (ESLint 10 fork of jsx-a11y)`; Interaction tests row → `Storybook play functions run by Vitest 5 (@storybook/addon-vitest)`; add row `Formatting | Prettier + prettier-plugin-tailwindcss (class sorting)`; Package manager row → `pnpm 10 workspaces (Node 24, pinned in .nvmrc)`.
3. **Repository structure**: in `tokens/` add `src/` (build modules) and `scripts/build.ts`; brand dirs `brands/acme/`, `brands/nova/`; in `ui/` replace `styles/` with `.storybook/preview.css (Tailwind entry)`, add `components.json`, `scripts/verify-dist.ts`, `tests/visual/` with `__screenshots__/linux` (CI baselines).
4. **Design tokens → Tiers table**: semantic example → `color.primary`, `color.muted-foreground`. Add under the table: "Semantic colors use the shadcn vocabulary (background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring — each with `-foreground` where text sits on it) plus success, warning and info, so upstream shadcn components need few class changes."
5. **Categories**: add a sentence "Implemented now: color, radius, font family, control and touch sizes. Tailwind's default scales serve as primitive scales for spacing (4px base), font size, breakpoints, containers and shadows; Tailwind's default color palette and radius scale are removed, so classes like `bg-red-500` do not exist. Other categories (motion, z-index, elevation) are added on demand."
6. **Naming**: replace the three bullets with: CSS variable `--ds-color-muted-foreground`; Tailwind utility `text-muted-foreground`; TS `tokens.color["muted-foreground"]` (a `var(--ds-…)` reference).
7. **Pipeline**: `dist/index.js` line → `typed CSS-variable references + brands list`.
8. **Components → header example**: replace with the actual header from `packages/ui/src/components/button/button.tsx`. Add bullet: "Imports inside packages are relative; the `@/` alias exists only for the shadcn CLI."
9. **Testing → Deterministic screenshots**: replace bullets and commands with: "Committed baselines live in `tests/visual/__screenshots__/linux/` and are produced only by CI (the official Playwright image). To create or update them, run the **Visual regression** workflow on your branch with `update: true`; it commits the new baselines. Locally, `pnpm test:visual` compares against your own `darwin/` baselines (gitignored) for quick feedback — create them with `pnpm --filter @acme/ui test:visual:update`." Remove the Docker requirement.
10. **Using the packages**: change `@source "../node_modules/@acme/ui";` to `@source "../node_modules/@acme/ui/dist";`.
11. **Development**: requirements → "Node 24 (`.nvmrc`) and pnpm 10. No Docker needed." Scripts table → `storybook`, `tokens:build`, `build`, `lint`, `format`, `format:check`, `typecheck`, `test`, `test:visual`, `changeset`, `version-packages`; delete `test:visual:update` from the root table (it is a `@acme/ui` script).
12. **Releasing**: add "Publishing is not wired yet: the Release workflow only opens the version PR until the real npm scope and registry are chosen."
13. **Roadmap**: prefix completed steps 1–10 with ✅ and mark step 11 as "Button ✅; next: Input, Label, Card, Dialog".

- [ ] **Step 2: CLAUDE.md edits**

- "Where things live": add `Token build code: packages/tokens/src/ (tests in packages/tokens/test/)` and `Storybook config and Tailwind entry: packages/ui/.storybook/`.
- "Done means verified" step 1 → "Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck` and `pnpm test` and paste the result."
- Always → Tokens example classes become `bg-background`, `text-muted-foreground`, `ps-4`; add "**Token edits.** After editing token JSON, run `pnpm tokens:build`." and "**Imports.** Use relative imports inside packages; the `@/` alias is only for the shadcn CLI."
- Ask first → baselines bullet becomes "updating visual-regression baselines (run the Visual regression workflow with `update: true`)".
- Never → replace the "Baselines outside Docker" bullet with "**Local baselines.** Never commit screenshots outside `__screenshots__/linux/`; those come only from CI. Local `darwin/` baselines stay gitignored."

- [ ] **Step 3: Decision record** — append to the spec:

```md
## Amendments (2026-10-21, bootstrap planning)

- **Semantic color names** follow the shadcn vocabulary plus success/warning/info (keeps upstream diffs small). CSS variables are prefixed `--ds-`.
- **Visual baselines (amends Q8)** are generated only in CI by the "Visual regression" workflow (`update: true`); no local Docker. Local per-OS baselines are gitignored.
- **Brands (Q3/Q14)** are seeded with `acme` (default) and a demo brand `nova`.
- **Formatting**: Prettier with prettier-plugin-tailwindcss; better-tailwindcss handles correctness rules, not class order.
- **A11y lint**: `eslint-plugin-jsx-a11y` does not support ESLint 10; `eslint-plugin-jsx-a11y-x` is used instead.
- **Versions**: Vitest 5 and Storybook 10.6 (verified together); Changesets stays on v2 and TypeScript on 6 for now.
- **Publishing** waits for the real npm scope; the Release workflow only opens version PRs.
```

- [ ] **Step 4: Verify consistency**

Run: `grep -nE "bg-surface|text-muted\b|Docker|--color-text-muted|src/styles" README.md CLAUDE.md`
Expected: no matches except intentional mentions ("No Docker needed", the Playwright image in the Testing section).

Run: `pnpm format:check`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
pnpm format
git add -A
git commit -m "docs: align README, CLAUDE.md and decision record with the bootstrapped setup

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Final verification (after Task 11)

Run, from a clean install:

```bash
rm -rf node_modules packages/*/node_modules packages/*/dist
pnpm install
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm --filter @acme/ui verify:dist && pnpm --filter @acme/tokens verify:dist
pnpm test:visual
```

Expected: every command exits 0. Report the output of each, and state explicitly that CI workflows and linux baselines are unverified until the repo is pushed to GitHub.
