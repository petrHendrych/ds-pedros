# Design system foundation: decision record

- **Date:** 2026-10-21
- **Status:** Accepted. Implementation (bootstrap) is planned separately.
- **Context:** Started from a clean Vite 8 + React 19 + TypeScript 6 + ESLint 10 template. The goal is
  a design system with:
  - owned shadcn components
  - a Tailwind-based token system
  - Storybook docs and tests
  - Playwright visual regression across browsers
  - responsive behavior as a top priority

  The decisions below came out of a structured grilling session. `README.md` describes the resulting
  architecture.

## Decisions

| #   | Topic              | Decision                                                                                                                                          | Why                                                                                               |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Q1  | Distribution       | Private npm packages (ESM + types + CSS), semver                                                                                                  | Apps upgrade deliberately; one source of truth instead of per-app forks                           |
| Q2  | Token source       | W3C DTCG JSON in repo → Style Dictionary → CSS vars + Tailwind v4 `@theme` + TS                                                                   | Standard format, multi-output, ready for Figma sync later                                         |
| Q3  | Theming            | Light/dark + multi-brand                                                                                                                          | Several products share the system with distinct brands                                            |
| Q4  | Primitives         | Radix UI under shadcn                                                                                                                             | Most mature ecosystem and shadcn's long-standing default                                          |
| Q5  | Accessibility      | WCAG 2.2 AA, enforced (fails CI)                                                                                                                  | A shared library multiplies every a11y bug across all consumers                                   |
| Q6  | Browsers           | Chromium, Firefox, WebKit desktop + Mobile Safari/Chrome emulation; last 2 evergreen versions                                                     | Covers all three engines plus touch/mobile without paid device clouds                             |
| Q7  | Responsive         | Mobile-first; viewport breakpoints for layouts, container queries for components                                                                  | Components get reused in sidebars, cards and modals, so the viewport is the wrong signal for them |
| Q8  | VR determinism     | Official Playwright Docker image locally + CI; baselines in git (LFS if large)                                                                    | Host fonts and anti-aliasing otherwise produce false diffs                                        |
| Q9  | Tests              | Storybook `play` via `@storybook/addon-vitest` + plain Vitest for utils                                                                           | Stories double as test cases; no parallel test fixtures                                           |
| Q10 | CI                 | GitHub + Actions                                                                                                                                  | Team default                                                                                      |
| Q11 | Icons              | `lucide-react`                                                                                                                                    | shadcn default, tree-shakeable, consistent style                                                  |
| Q12 | CLAUDE.md          | Always / Ask first / Never tiers                                                                                                                  | Clear, verifiable agent boundaries                                                                |
| Q13 | Repo shape         | pnpm monorepo: `packages/tokens`, `packages/ui`                                                                                                   | Tokens are usable without React and release independently                                         |
| Q14 | Brand application  | One CSS file per brand; light/dark at runtime via `[data-theme]` + `prefers-color-scheme`                                                         | Small CSS per app; theme switch without reload                                                    |
| Q15 | Token tiers        | Primitive → semantic; component tier only on demand                                                                                               | Avoids token explosion; components stay brand-agnostic                                            |
| Q16 | Package names      | Placeholder `@acme/ui`, `@acme/tokens`                                                                                                            | Real scope to be decided                                                                          |
| Q17 | Consumers          | Mixed, incl. Next.js RSC: `"use client"` on interactive components, no DOM at module scope                                                        | Library must render on the server                                                                 |
| Q18 | Fonts              | Families are tokens; apps load font files; Storybook/Playwright load them locally                                                                 | Avoids licensing/bundle weight in the package; deterministic screenshots                          |
| Q19 | Docs hosting       | Storybook on GitHub Pages from `main`                                                                                                             | Free, same platform as CI                                                                         |
| Q20 | RTL / i18n         | RTL-ready via logical properties; RTL story per component; strings via props                                                                      | Cheap to do from day one, expensive to retrofit                                                   |
| Q21 | VR matrix          | Tiered (A: default brand, Chromium, all widths, light+dark · B: other engines at 360 + 1280, light · C: other brands, Chromium, 1280, light+dark) | The full Cartesian matrix is unaffordable; tiers keep the coverage that catches real bugs         |
| Q22 | Releases           | Changesets; 0.x until API stable; deprecate in a minor, remove in next major                                                                      | Explicit, reviewable release notes; predictable migrations                                        |
| Q23 | shadcn upstream    | Owned fork; header records upstream + deviations; manual diff pulls, never `--overwrite`                                                          | Keeps our changes safe while still allowing upstream fixes                                        |
| Q24 | Definition of Done | Full checklist (see README)                                                                                                                       | Consistency across components from the first one                                                  |

## Defaults chosen during planning (changeable)

These are implementation choices, not user decisions; revisit freely.

- **Tooling:**
  - Storybook 10 (`@storybook/react-vite`)
  - Tailwind v4
  - `class-variance-authority` + `tailwind-merge`
  - tsdown for the library build
  - Node 24 via `.nvmrc`
- **React:** refs passed as a plain prop (React 19); no `forwardRef`.
- **ESLint additions:**
  - `eslint-plugin-jsx-a11y`
  - `eslint-plugin-storybook`
  - `eslint-plugin-better-tailwindcss`, which bans arbitrary values
- **Breakpoints:** Tailwind defaults (sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536).
- **Visual-regression widths:** 360 / 768 / 1280 / 1536.
- **Spacing and touch targets:** 4px spacing base; touch targets ≥ 44px on touch devices, with
  WCAG 2.5.8's 24px as the floor.

## Out of scope / open

- Real npm scope and brand list
- Figma integration (Tokens Studio / Variables sync, Code Connect)
- Storybook PR previews
- Exact list of first components beyond the starter set
