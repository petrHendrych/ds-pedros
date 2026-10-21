# CLAUDE.md

`@acme` design system: owned shadcn/ui components (Radix) on Tailwind v4, multi-brand DTCG tokens,
Storybook docs, Playwright visual regression. The repo is **mid-bootstrap**. `README.md` describes the
target architecture, and `docs/superpowers/specs/` holds the decisions behind it. Read both before
structural work. When the code and the README disagree, ask which one is right.

## Where things live

- Token sources: `packages/tokens/tokens/{primitive,semantic,brands/<brand>}/*.json` (DTCG)
- Generated token output: `packages/tokens/dist/`. Rebuild it from the JSON sources.
- Component, story and docs live together: `packages/ui/src/components/<name>/`
- Visual tests and baselines: `packages/ui/tests/visual/`

## Done means verified

Before you report work as done:
1. Run the lint, typecheck and test scripts from `package.json` and paste the result.
2. Check the component against the Definition of Done checklist in `README.md`.

Say what you did not run (for example, visual tests that need Docker) instead of implying it passed.

## Always

- **Tokens.** Style with semantic token utilities (`bg-surface`, `text-muted`, `p-inset-md`).
  Components never reference primitive or component-tier tokens.
- **Responsive.** Write mobile-first. Components respond to their container (`@container`, `@md:`).
  Page layouts respond to viewport breakpoints.
- **Logical properties.** Use `ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`/`text-start`/`border-s` so
  components work in RTL.
- **Server rendering.** Put `"use client"` at the top of interactive components. Access
  browser globals only inside effects or event handlers.
- **Stories.** Cover every variant and state, plus a dark-theme story and an RTL story.
- **shadcn header.** When you change a component, update its upstream/deviation header.
- **Changesets.** Add one (`pnpm changeset`) for any change to a published package.

## Ask first

Stop and get explicit approval before:

- adding, removing or upgrading a dependency
- adding or changing a token value or primitive, or adding a brand
- updating visual-regression baselines (`test:visual:update`)
- pulling upstream shadcn changes into a component
- changing a component's public API, or anything a consumer would see as breaking
- editing CI workflows, or build, TS, ESLint, Tailwind, Storybook or Playwright config
- deleting files

## Never

Each rule names the right move beside the guardrail.

- **Raw values.** Raw colors, pixel sizes and Tailwind arbitrary values (`bg-[#fff]`, `p-[13px]`)
  are never allowed. If no token fits, propose a new token instead.
- **Physical direction utilities.** `ml-`, `pr-`, `left-` and similar are never allowed. Use the
  logical equivalent.
- **Generated files.** `packages/tokens/dist/` is never hand-edited. Edit the JSON sources and rebuild.
- **shadcn overwrite.** Never run `shadcn add --overwrite`. Pull upstream changes by reading the diff.
- **Baselines outside Docker.** Never generate baselines outside the Playwright Docker image, because
  host fonts make them non-deterministic.
- **Bypassing a failing gate.** Never disable lint or a11y rules, or skip, weaken or delete tests to
  make a check pass. Fix the cause, or report the failure.
- **Releases.** Never run `npm publish` or `changeset version`, push, tag or create releases.
  Releases go through the Changesets PR.
