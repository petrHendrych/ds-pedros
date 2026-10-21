# @petrhendrych design system

React component library and design-token system for Acme products: owned shadcn/ui components on
Radix primitives, styled with Tailwind CSS v4, driven by multi-brand design tokens, documented in
Storybook and guarded by visual-regression tests across browsers and viewports.

> **Status: bootstrapped.** Tokens, Storybook, lint guardrails, Button, visual regression, CI and
> Changesets are in place; see [Roadmap](#roadmap). Packages are published to GitHub Packages under the `@petrhendrych` scope.
> Decision record: [`docs/superpowers/specs/2026-10-21-design-system-foundation-design.md`](docs/superpowers/specs/2026-10-21-design-system-foundation-design.md).

---

## Principles

1. **Tokens first.** Every color, space, size, radius, font, shadow, duration and z-index comes from a
   design token. Components never contain raw values.
2. **Responsive first.** Mobile-first styles; components adapt to their _container_ (container
   queries), pages adapt to the _viewport_ (breakpoints). Every component is verified at every
   supported width.
3. **Accessible by default.** WCAG 2.2 AA is a merge gate, not a goal.
4. **We own the code.** Components start from shadcn/ui and become ours; upstream changes are pulled
   deliberately, never blindly.
5. **Works everywhere it's consumed.** SSR/React Server Components safe, RTL-ready, brand- and
   theme-agnostic.

## Stack

| Concern              | Choice                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| UI runtime           | React 19, TypeScript                                                                                    |
| Styling              | Tailwind CSS v4 (CSS-first `@theme`)                                                                    |
| Components           | shadcn/ui (owned fork) on Radix UI primitives                                                           |
| Variants             | `class-variance-authority` + `cn()` (`clsx` + `tailwind-merge`)                                         |
| Icons                | `lucide-react`                                                                                          |
| Tokens               | W3C DTCG JSON → Style Dictionary → CSS variables, Tailwind `@theme`, TS                                 |
| Docs & workbench     | Storybook 10 (`@storybook/react-vite`), autodocs + MDX                                                  |
| Interaction tests    | Storybook `play` functions run by Vitest 5 (`@storybook/addon-vitest`)                                  |
| Unit tests           | Vitest                                                                                                  |
| Visual regression    | Playwright; committed baselines come from the official Playwright image in CI                           |
| Accessibility checks | Storybook a11y addon, `@axe-core/playwright`, `eslint-plugin-jsx-a11y-x` (ESLint 10 fork of `jsx-a11y`) |
| Formatting           | Prettier + `prettier-plugin-tailwindcss` (class sorting)                                                |
| Library build        | tsdown (unbundled ESM + `.d.ts`)                                                                        |
| Package manager      | pnpm 10 workspaces (Node 24, pinned in `.nvmrc`)                                                        |
| Versioning           | Changesets                                                                                              |
| CI / docs hosting    | GitHub Actions; Storybook published to GitHub Pages                                                     |

## Repository structure

```
.
├── packages/
│   ├── tokens/                   @petrhendrych/tokens — framework-agnostic
│   │   ├── tokens/
│   │   │   ├── primitive/        raw color ramps (palette.*)
│   │   │   ├── semantic/         base.json (radius, font, sizes), color.light.json, color.dark.json
│   │   │   └── brands/           acme/, nova/ — per-brand overrides (base, light, dark)
│   │   ├── src/                  build modules (sources, resolve, css, js)
│   │   ├── scripts/build.ts      writes dist/
│   │   ├── test/                 contrast, parity, output tests
│   │   └── dist/                 GENERATED — brand CSS, Tailwind theme, TS constants
│   └── ui/                       @petrhendrych/ui — React components
│       ├── .storybook/           Storybook config; preview.css is the Tailwind entry
│       ├── components.json       shadcn CLI config (for `add --diff` / `view`)
│       ├── src/
│       │   ├── components/<name>/  <name>.tsx, <name>.stories.tsx, <name>.mdx
│       │   ├── foundations/        token showcase stories
│       │   └── lib/                cn()
│       ├── scripts/verify-dist.ts  checks the built package (exports, "use client")
│       └── tests/visual/           Playwright specs; __screenshots__/linux = CI baselines
├── .changeset/
├── .github/workflows/            ci, visual, storybook, release
└── docs/                         decision records, specs, plans
```

## Design tokens

### Tiers

| Tier          | Example                                   | Who references it                                                               |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| **Primitive** | `palette.blue.600`                        | Only semantic tokens                                                            |
| **Semantic**  | `color.primary`, `color.muted-foreground` | Components (via Tailwind utilities)                                             |
| **Component** | `button.bg.primary`                       | Added **on demand**, only when a brand needs to diverge from the semantic layer |

Components consume **semantic tokens only**. Brands override primitives and/or semantics; a brand
never forces a component change.

Semantic colors use the shadcn vocabulary (background, foreground, card, popover, primary,
secondary, muted, accent, destructive, border, input, ring — each with `-foreground` where text sits
on it) plus success, warning and info, so upstream shadcn components need few class changes.

### Categories

- **Color**: palettes (primitive), and semantic roles for background, foreground/text, border, ring/focus, and status (success, warning, destructive, info)
- **Spacing**: 4px base scale, plus semantic insets, gaps and stacks
- **Sizing**: control heights, icon sizes, container widths
- **Radius**
- **Border width**
- **Typography**: family, size, weight, line height, letter spacing, composed into text styles
- **Shadow / elevation**
- **Opacity**
- **Motion**: duration and easing, with reduced-motion alternatives
- **Z-index**: named layers such as dropdown, sticky, overlay, modal, toast
- **Breakpoints and container sizes**

Implemented now: color, radius, font family, control and touch sizes. Tailwind's default scales
serve as primitive scales for spacing (4px base), font size, breakpoints, containers and shadows;
Tailwind's default color palette and radius scale are removed, so classes like `bg-red-500` do not
exist. Other categories (motion, z-index, elevation) are added on demand.

### Naming

DTCG JSON uses dot paths (`color.muted-foreground`), and the build exposes each token in three places:

- as a CSS variable: `--ds-color-muted-foreground`
- as a Tailwind utility: `text-muted-foreground`
- as a TS constant: `tokens.color["muted-foreground"]` (a `var(--ds-…)` reference)

### Pipeline

```
tokens/**/*.json (DTCG)
        │  Style Dictionary
        ▼
dist/brands/<brand>.css   CSS variables for :root (light) + [data-theme="dark"] + prefers-color-scheme
dist/theme.css            Tailwind v4 @theme mapping utilities → CSS variables, dark variant, base layer
dist/index.js             typed CSS-variable references + brands list (for JS/canvas/charts)
```

Files in `dist/` are **generated**. To change a value, edit the JSON source and run `pnpm tokens:build`.

### Brands and themes

- Each brand has its own stylesheet, and an app imports **one** of them, which keeps the CSS small.
- Light and dark are switched at runtime:
  - `data-theme="light" | "dark"` on `<html>` (or any subtree) sets the theme explicitly.
  - Without the attribute, the theme follows `prefers-color-scheme`.
- Every component must render correctly in every brand × theme combination; text and UI color
  pairs are contrast-tested for every brand × theme in `packages/tokens/test/contrast.test.ts`.

## Components

- **Origin.** Components start from shadcn/ui (Radix variant). They are an **owned fork**: once
  copied in, they are our code.
- **Upstream tracking.** Every component file starts with a header that records its upstream origin
  and our deviations, for example:

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
  ```

  We pull upstream changes manually by diff review. We never run `shadcn add --overwrite`.

- **Conventions.**
  - Variants are defined with `cva`.
  - Class names are merged with `cn()`.
  - Refs are passed as a plain prop (React 19), with no `forwardRef`.
  - Composition uses `asChild` via Radix `Slot`.
  - Interactive components start with `"use client"`.
  - Nothing touches `window` or `document` at module scope.
  - Styles use semantic token utilities and logical properties only (see [Responsive design](#responsive-design)).
  - Imports inside packages are relative; the `@/` alias exists only for the shadcn CLI.
- **Public API.** The package root (`@petrhendrych/ui`) exports everything that is public. Anything not
  exported from the root is internal.

## Responsive design

Responsiveness is a top priority.

| Token | Min width | Typical target              |
| ----- | --------- | --------------------------- |
| base  | 0         | Phones (design at 360px)    |
| `sm`  | 640px     | Large phones / small tablet |
| `md`  | 768px     | Tablets                     |
| `lg`  | 1024px    | Small laptops               |
| `xl`  | 1280px    | Desktops                    |
| `2xl` | 1536px    | Wide screens                |

- **Mobile-first.** Unprefixed classes target the smallest screen. Prefixes (`md:`) add behavior as
  the screen gets wider.
- **Components use container queries** (`@container`, `@md:`) so they adapt to the space they are
  given. **Page layouts** use viewport breakpoints.
- **Touch targets** are ≥ 44×44px on touch devices, with WCAG 2.5.8's 24×24px as the absolute floor.
  Hover-only affordances always have a touch/keyboard equivalent.
- **Motion** respects `prefers-reduced-motion`.
- **Visual-regression widths:** 360, 768, 1280 and 1536px.

## Accessibility

- **Target:** WCAG 2.2 AA.
- **Gates that fail CI:**
  - `eslint-plugin-jsx-a11y-x`
  - the Storybook a11y addon (axe), run in the Vitest suite
  - `@axe-core/playwright` in browser runs
  - token contrast tests for every brand × theme
- **Each component's docs include:** keyboard interaction table, focus behavior, ARIA roles used,
  and screen-reader notes.
- **Focus** is always visible (`focus-visible` ring token, an outline that survives forced-colors
  mode). Color contrast is checked against every brand × theme.

## Browser & device support

Last 2 versions of evergreen browsers.

| Playwright profile    | Engine   | Purpose                  |
| --------------------- | -------- | ------------------------ |
| Desktop Chrome / Edge | Chromium | Primary                  |
| Desktop Firefox       | Gecko    | Cross-engine             |
| Desktop Safari        | WebKit   | Cross-engine             |
| Mobile Safari         | WebKit   | iPhone emulation (touch) |
| Mobile Chrome         | Chromium | Pixel emulation (touch)  |

## Testing

| Layer              | Tool                                                          | What it proves                                |
| ------------------ | ------------------------------------------------------------- | --------------------------------------------- |
| Unit               | Vitest                                                        | Utilities, token transforms, contrast, lint   |
| Interaction + a11y | Storybook `play` via `@storybook/addon-vitest` (browser mode) | Behavior, keyboard flows, axe per story       |
| Visual regression  | Playwright over the built Storybook                           | Pixels across engines, widths, brands, themes |

**Stories are the test cases.** Playwright reads the Storybook index and screenshots each story
according to the matrix below. Stories tagged `no-vr` are skipped.

### Visual-regression matrix (tiered)

| Tier            | Brand            | Profiles                                      | Widths                                        | Themes       |
| --------------- | ---------------- | --------------------------------------------- | --------------------------------------------- | ------------ |
| A: full         | default          | Chromium                                      | 360, 768, 1280, 1536                          | light + dark |
| B: cross-engine | default          | Firefox, WebKit, Mobile Safari, Mobile Chrome | 360 + 1280 (mobile profiles use device width) | light        |
| C: brands       | each other brand | Chromium                                      | 1280                                          | light + dark |

### Baselines

Fonts and anti-aliasing differ between macOS, Windows and Linux, so baselines are stored per OS:

- Committed baselines live in `tests/visual/__screenshots__/linux/` and are produced **only by CI**
  in the official Playwright image. To create or update them, run the **Visual regression**
  workflow on your branch with `update: true` (Actions tab, or
  `gh workflow run visual.yml --ref <branch> -f update=true`). It commits the new baselines and then
  re-runs CI and the comparison on that commit.
- A new story has no baseline yet, so its first comparison fails; run the update on the PR branch.
- Locally, `pnpm test:visual` compares against your own `darwin/` (or `win32/`) baselines, which
  are gitignored. Create them with `pnpm --filter @petrhendrych/ui test:visual:update`.
- Fonts are loaded from local files and animations are disabled.

## Repository setup (one-time, on GitHub)

1. **Actions → General → Workflow permissions:** enable "Allow GitHub Actions to create and approve
   pull requests" (the Release workflow opens the Version PR).
2. **Pages → Source:** "GitHub Actions" (the Storybook workflow deploys there). Pages on a
   **private** repository needs a paid GitHub plan; on a free plan the Storybook workflow fails at
   deploy until the repo is public or the plan changes.
3. **Optional `CHANGESETS_TOKEN` secret** (fine-grained PAT or GitHub App token with contents and
   pull-requests write): PRs opened with the default `GITHUB_TOKEN` do not trigger CI, so without it
   close and reopen the Version PR to get checks.
4. **First baselines.** `workflow_dispatch` is only available once a workflow exists on `main`, so:
   merge the bootstrap PR without requiring "Visual regression" (its comparison fails while no
   baselines exist), run the Visual regression workflow on `main` with `update: true`, then turn on
   branch protection for `main` requiring **CI** and **Visual regression**. From then on, run the
   update on PR branches.

## Using the packages

The packages are **private** on GitHub Packages. Installing needs a GitHub personal access token
(classic) with the `read:packages` scope, from an account that has access to the packages.

```ini
# .npmrc in the consuming project (keep the token itself out of git)
@petrhendrych:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

```bash
export GITHUB_PACKAGES_TOKEN=ghp_…   # read:packages
pnpm add @petrhendrych/ui @petrhendrych/tokens
```

In CI, set `GITHUB_PACKAGES_TOKEN` from a secret. A workflow in another repository can use its
`GITHUB_TOKEN` only after that repository is granted read access in the package settings
(Package settings → Manage Actions access).

```css
/* app entry CSS */
@import "tailwindcss";
@import "@petrhendrych/tokens/brands/acme.css"; /* exactly one brand */
@import "@petrhendrych/tokens/theme.css"; /* Tailwind @theme mapping */
@source "../node_modules/@petrhendrych/ui/dist"; /* let Tailwind see component classes */
```

```tsx
import { Button } from "@petrhendrych/ui";

<html data-theme="dark"> {/* optional; defaults to prefers-color-scheme */}
```

- **Fonts.** Tokens define font families. The consuming app loads the font files itself (self-host,
  `next/font`, etc.).
- **Next.js / RSC.** Interactive components already carry `"use client"`. Static components can be
  rendered on the server.

## Development

Requires Node 24 (`.nvmrc`) and pnpm 10. No Docker needed. `pnpm install` also builds the tokens.

| Script                  | Does                                                      |
| ----------------------- | --------------------------------------------------------- |
| `pnpm storybook`        | Storybook dev server (the component workbench)            |
| `pnpm tokens:build`     | Regenerate `packages/tokens/dist`                         |
| `pnpm build`            | Build all packages                                        |
| `pnpm lint`             | ESLint (incl. a11y, Storybook, Tailwind token rules)      |
| `pnpm format`           | Prettier (writes)                                         |
| `pnpm format:check`     | Prettier (checks)                                         |
| `pnpm typecheck`        | `tsc --noEmit` in every package                           |
| `pnpm test`             | Vitest: unit, contrast, lint rules, Storybook interaction |
| `pnpm test:visual`      | Build Storybook and run Playwright visual regression      |
| `pnpm changeset`        | Describe a change for the next release                    |
| `pnpm version-packages` | Apply changesets (used by the Release workflow)           |

## Releasing & deprecation

- **Every PR that changes a package includes a changeset** (`pnpm changeset`). On `main`, the
  Changesets action opens a "Version packages" PR.
- **Merging the Version PR publishes.** With no changesets pending, the Release workflow builds and
  runs `changeset publish`: every package version not yet in GitHub Packages is published (private,
  `@petrhendrych` scope) and tagged. It uses the built-in `GITHUB_TOKEN` with `packages: write`.
- **Pre-1.0 versions (`0.x`):** a minor bump may break the API, and the changeset says so explicitly.
- **Deprecation:**
  1. Deprecate in a minor release, using all of:
     - `@deprecated` JSDoc with the replacement
     - a development-only console warning
     - a note in the docs
  2. Remove in the next major release.

## Contributing: Definition of Done

A component is done when:

- [ ] Stories cover every variant, size and state (hover, focus, disabled, loading, error, empty, long content)
- [ ] Autodocs + a usage MDX page (do/don't, a11y notes, keyboard table)
- [ ] `play` tests cover interactions and keyboard navigation
- [ ] axe passes for every story
- [ ] VR baselines exist for its tier-A/B/C matrix cells
- [ ] An RTL story renders correctly (logical properties only)
- [ ] It works in every brand × light/dark
- [ ] It uses semantic tokens only: no raw values, no arbitrary Tailwind values
- [ ] It is SSR-safe, with `"use client"` if interactive
- [ ] The upstream/deviation header is up to date
- [ ] A changeset is added

## Roadmap

1. ✅ `git init`, `.nvmrc` (GitHub repo still to be created)
2. ✅ Convert to a pnpm monorepo (`packages/tokens`, `packages/ui`), removing the Vite template app
3. ✅ Tokens: DTCG sources, Style Dictionary build, brands `acme` and `nova` (light + dark)
4. ✅ Tailwind v4 + shadcn config (Radix), `cn()`, base styles wired to tokens
5. ✅ Storybook 10 + a11y addon + theme/brand/RTL/viewport toolbar
6. ✅ Vitest + `@storybook/addon-vitest`
7. ✅ Playwright VR with the tiered matrix (CI-owned linux baselines)
8. ✅ ESLint additions (`jsx-a11y-x`, `storybook`, `better-tailwindcss`)
9. ✅ GitHub Actions: lint, typecheck, test, VR, Storybook deploy to Pages
10. ✅ Changesets (publishing waits for the real npm scope)
11. First components: Button ✅, Input ✅, Label ✅, Field ✅, Card ✅; next: Dialog, then grow by demand
