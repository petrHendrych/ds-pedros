# @acme design system

React component library and design-token system for Acme products: owned shadcn/ui components on
Radix primitives, styled with Tailwind CSS v4, driven by multi-brand design tokens, documented in
Storybook and guarded by visual-regression tests across browsers and viewports.

> **Status: bootstrapping.** The repository is still the Vite + React + TypeScript template.
> Everything below describes the **target** architecture; see [Roadmap](#roadmap) for progress.
> `@acme` is a placeholder scope.
> Decision record: [`docs/superpowers/specs/2026-10-21-design-system-foundation-design.md`](docs/superpowers/specs/2026-10-21-design-system-foundation-design.md).

---

## Principles

1. **Tokens first.** Every color, space, size, radius, font, shadow, duration and z-index comes from a
   design token. Components never contain raw values.
2. **Responsive first.** Mobile-first styles; components adapt to their *container* (container
   queries), pages adapt to the *viewport* (breakpoints). Every component is verified at every
   supported width.
3. **Accessible by default.** WCAG 2.2 AA is a merge gate, not a goal.
4. **We own the code.** Components start from shadcn/ui and become ours; upstream changes are pulled
   deliberately, never blindly.
5. **Works everywhere it's consumed.** SSR/React Server Components safe, RTL-ready, brand- and
   theme-agnostic.

## Stack

| Concern              | Choice                                                                       |
| -------------------- | ---------------------------------------------------------------------------- |
| UI runtime           | React 19, TypeScript                                                         |
| Styling              | Tailwind CSS v4 (CSS-first `@theme`)                                         |
| Components           | shadcn/ui (owned fork) on Radix UI primitives                                |
| Variants             | `class-variance-authority` + `cn()` (`clsx` + `tailwind-merge`)              |
| Icons                | `lucide-react`                                                               |
| Tokens               | W3C DTCG JSON → Style Dictionary → CSS variables, Tailwind `@theme`, TS      |
| Docs & workbench     | Storybook 10 (`@storybook/react-vite`), autodocs + MDX                       |
| Interaction tests    | Storybook `play` functions run by Vitest (`@storybook/addon-vitest`)         |
| Unit tests           | Vitest                                                                       |
| Visual regression    | Playwright, in the official Playwright Docker image                          |
| Accessibility checks | Storybook a11y addon, `@axe-core/playwright`, `eslint-plugin-jsx-a11y`       |
| Library build        | tsdown (ESM + `.d.ts`)                                                       |
| Package manager      | pnpm workspaces (Node 24, pinned in `.nvmrc`)                                |
| Versioning           | Changesets                                                                   |
| CI / docs hosting    | GitHub Actions; Storybook published to GitHub Pages                          |

## Repository structure (target)

```
.
├── packages/
│   ├── tokens/                   @acme/tokens — framework-agnostic
│   │   ├── tokens/
│   │   │   ├── primitive/        raw scales: color ramps, spacing scale, font sizes…
│   │   │   ├── semantic/         intent: surface, text-muted, border-strong, space-inset-md…
│   │   │   └── brands/<brand>/   per-brand overrides of primitive + semantic (light & dark)
│   │   ├── style-dictionary.config.ts
│   │   └── dist/                 GENERATED — brand CSS, Tailwind theme, TS constants
│   └── ui/                       @acme/ui — React components
│       ├── src/
│       │   ├── components/<name>/  <name>.tsx, <name>.stories.tsx, <name>.mdx
│       │   ├── lib/                cn(), shared hooks/utils
│       │   └── styles/             Tailwind entry, base layer
│       ├── .storybook/
│       └── tests/visual/           Playwright VR specs + committed baselines
├── .changeset/
├── .github/workflows/
└── docs/                          decision records and specs
```

## Design tokens

### Tiers

| Tier          | Example                              | Who references it                            |
| ------------- | ------------------------------------ | -------------------------------------------- |
| **Primitive** | `color.blue.600`, `space.4`          | Only semantic tokens                         |
| **Semantic**  | `color.bg.surface`, `space.inset.md` | Components (via Tailwind utilities)          |
| **Component** | `button.bg.primary`                  | Added **on demand**, only when a brand needs to diverge from the semantic layer |

Components consume **semantic tokens only**. Brands override primitives and/or semantics; a brand
never forces a component change.

### Categories

- **Color**: palettes (primitive), and semantic roles for background, foreground/text, border, ring/focus, and status (success, warning, danger, info)
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

### Naming

DTCG JSON uses dot paths (`color.text.muted`), and the build exposes each token in three places:

- as a CSS variable: `--color-text-muted`
- as a Tailwind utility: `text-muted`
- as a TS constant: `tokens.color.text.muted`

### Pipeline

```
tokens/**/*.json (DTCG)
        │  Style Dictionary
        ▼
dist/brands/<brand>.css   CSS variables for :root (light) + [data-theme="dark"] + prefers-color-scheme
dist/theme.css            Tailwind v4 @theme mapping utilities → CSS variables
dist/index.ts             typed token constants (for JS/canvas/charts)
```

Files in `dist/` are **generated**. To change a value, edit the JSON source and run `pnpm tokens:build`.

### Brands and themes

- Each brand has its own stylesheet, and an app imports **one** of them, which keeps the CSS small.
- Light and dark are switched at runtime:
  - `data-theme="light" | "dark"` on `<html>` sets the theme explicitly.
  - Without the attribute, the theme follows `prefers-color-scheme`.
- Every component must render correctly in every brand × theme combination.

## Components

- **Origin.** Components start from shadcn/ui (Radix variant). They are an **owned fork**: once
  copied in, they are our code.
- **Upstream tracking.** Every component file starts with a header that records its upstream origin
  and our deviations:

  ```tsx
  /**
   * Upstream: shadcn/ui `button` (registry version 2026-10)
   * Deviations:
   *  - sizes use control-height tokens instead of h-9/h-10
   *  - added `loading` prop
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
- **Public API.** The package root (`@acme/ui`) exports everything that is public. Anything not
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
  - `eslint-plugin-jsx-a11y`
  - the Storybook a11y addon (axe), run in the Vitest suite
  - `@axe-core/playwright` in browser runs
- **Each component's docs include:** keyboard interaction table, focus behavior, ARIA roles used,
  and screen-reader notes.
- **Focus** is always visible (`focus-visible` ring token). Color contrast is checked against every
  brand × theme.

## Browser & device support

Last 2 versions of evergreen browsers.

| Playwright profile    | Engine   | Purpose                   |
| --------------------- | -------- | ------------------------- |
| Desktop Chrome / Edge | Chromium | Primary                   |
| Desktop Firefox       | Gecko    | Cross-engine              |
| Desktop Safari        | WebKit   | Cross-engine              |
| Mobile Safari         | WebKit   | iPhone emulation (touch)  |
| Mobile Chrome         | Chromium | Pixel emulation (touch)   |

## Testing

| Layer             | Tool                                       | What it proves                                    |
| ----------------- | ------------------------------------------ | ------------------------------------------------- |
| Unit              | Vitest                                     | Utilities, hooks, token transforms                |
| Interaction + a11y| Storybook `play` via `@storybook/addon-vitest` (browser mode) | Behavior, keyboard flows, axe per story |
| Visual regression | Playwright over the built Storybook        | Pixels across engines, widths, brands, themes     |

**Stories are the test cases.** Playwright reads the Storybook index and screenshots each story
according to the matrix below.

### Visual-regression matrix (tiered)

| Tier            | Brand        | Profiles                              | Widths                  | Themes       |
| --------------- | ------------ | ------------------------------------- | ----------------------- | ------------ |
| A: full         | default      | Chromium                              | 360, 768, 1280, 1536    | light + dark |
| B: cross-engine | default      | Firefox, WebKit, Mobile Safari, Mobile Chrome | 360 + 1280 (mobile profiles use device width) | light |
| C: brands       | each other brand | Chromium                          | 1280                    | light + dark |

### Deterministic screenshots

Fonts and anti-aliasing differ between macOS, Windows and Linux. To keep screenshots comparable:

- Visual tests **always** run inside the official Playwright Docker image, both locally and in CI.
- Fonts are loaded from local files.
- Animations are disabled.
- Baselines are committed to git (Git LFS if they grow large).

```bash
pnpm test:visual           # compare against baselines (runs in Docker)
pnpm test:visual:update    # regenerate baselines (runs in Docker); review the diff before committing
```

## Using the packages

```bash
pnpm add @acme/ui @acme/tokens
```

```css
/* app entry CSS */
@import "tailwindcss";
@import "@acme/tokens/brands/acme.css";   /* exactly one brand */
@import "@acme/tokens/theme.css";         /* Tailwind @theme mapping */
@source "../node_modules/@acme/ui";       /* let Tailwind see component classes */
```

```tsx
import { Button } from "@acme/ui";

<html data-theme="dark"> {/* optional; defaults to prefers-color-scheme */}
```

- **Fonts.** Tokens define font families. The consuming app loads the font files itself (self-host,
  `next/font`, etc.).
- **Next.js / RSC.** Interactive components already carry `"use client"`. Static components can be
  rendered on the server.

## Development

Requires Node 24 (`.nvmrc`), pnpm and Docker (for visual tests).

| Script                    | Does                                               |
| ------------------------- | -------------------------------------------------- |
| `pnpm storybook`          | Storybook dev server (the component workbench)     |
| `pnpm tokens:build`       | Regenerate `packages/tokens/dist`                  |
| `pnpm build`              | Build all packages                                 |
| `pnpm lint`               | ESLint (incl. a11y, Storybook, Tailwind rules)     |
| `pnpm typecheck`          | `tsc -b`                                           |
| `pnpm test`               | Vitest: unit + Storybook interaction/a11y tests    |
| `pnpm test:visual`        | Playwright visual regression (Docker)              |
| `pnpm test:visual:update` | Regenerate VR baselines (Docker)                   |
| `pnpm changeset`          | Describe a change for the next release             |

## Releasing & deprecation

- **Every PR that changes a package includes a changeset** (`pnpm changeset`). On `main`, the
  Changesets action opens a release PR. Merging that PR publishes the packages.
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

1. `git init`, GitHub repo, `.nvmrc`
2. Convert to a pnpm monorepo (`packages/tokens`, `packages/ui`), removing the Vite template app
3. Tokens: DTCG sources, Style Dictionary build, first brand (light + dark)
4. Tailwind v4 + shadcn init (Radix), `cn()`, base styles wired to tokens
5. Storybook 10 + a11y addon + theme/brand/RTL/viewport toolbar
6. Vitest + `@storybook/addon-vitest`
7. Playwright VR in Docker with the tiered matrix
8. ESLint additions (`jsx-a11y`, `storybook`, `better-tailwindcss`)
9. GitHub Actions: lint, typecheck, test, VR, Storybook deploy to Pages
10. Changesets + publishing
11. First components: Button, Input, Label, Card, Dialog, then grow by demand
