import type { Meta, StoryObj } from "@storybook/react-vite"
import { useSyncExternalStore } from "react"
import { expect } from "storybook/test"

interface Ramp {
  name: string
  steps: Array<{ step: string; variable: string; value: string }>
}

/**
 * Primitive ramps are not in the JS export (components never use them), so read them from the
 * active brand stylesheet: every `--ds-palette-*` property, grouped by ramp, in source order.
 */
function readRamps(): Ramp[] {
  const ramps = new Map<string, Ramp>()
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules)) {
      if (!(rule instanceof CSSStyleRule)) continue
      for (const property of Array.from(rule.style)) {
        const [, name, step] = property.match(/^--ds-palette-(.+)-(\d+)$/) ?? []
        if (!name || !step) continue
        const ramp = ramps.get(name) ?? { name, steps: [] }
        if (ramp.steps.some((entry) => entry.step === step)) continue
        ramp.steps.push({
          step,
          variable: property,
          value: rule.style.getPropertyValue(property).trim(),
        })
        ramps.set(name, ramp)
      }
    }
  }
  return [...ramps.values()]
}

let cached: { sheets: StyleSheet[]; ramps: Ramp[] } | undefined

/** Re-reads only when the set of stylesheets changes (switching brand swaps the brand sheet). */
function snapshot(): Ramp[] {
  const sheets = Array.from(document.styleSheets)
  const unchanged =
    cached?.sheets.length === sheets.length &&
    sheets.every((sheet, i) => cached?.sheets[i] === sheet)
  if (!cached || !unchanged) cached = { sheets, ramps: readRamps() }
  return cached.ramps
}

const noRamps: Ramp[] = []
// Story re-renders (brand or theme switches) call snapshot() again, so no subscription is needed.
const subscribe = () => () => {}

function Palette() {
  const ramps = useSyncExternalStore(subscribe, snapshot, () => noRamps)

  return (
    <div className="@container flex flex-col gap-8">
      {ramps.map((ramp) => (
        <section key={ramp.name} aria-labelledby={`ramp-${ramp.name}`}>
          <h2
            id={`ramp-${ramp.name}`}
            className="mb-3 font-mono text-sm font-medium text-foreground"
          >
            {ramp.name}
          </h2>
          <ul
            aria-label={ramp.name}
            className="grid grid-cols-3 gap-3 @md:grid-cols-6 @4xl:grid-cols-12"
          >
            {ramp.steps.map(({ step, variable, value }) => (
              <li key={step} className="flex min-w-0 flex-col gap-1">
                <span
                  aria-hidden
                  className="h-control-lg rounded-md border"
                  style={{ backgroundColor: `var(${variable})` }}
                />
                <span className="font-mono text-xs text-foreground">
                  {step}
                </span>
                <span className="font-mono text-xs break-all text-muted-foreground">
                  {value}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

const meta = {
  title: "Foundations/Palette",
  component: Palette,
} satisfies Meta<typeof Palette>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    const gold = await canvas.findByRole("list", { name: "sunflower-gold" })
    await expect(gold.querySelectorAll("li")).toHaveLength(11)
    for (const name of ["success", "error", "warning", "info"]) {
      await expect(canvas.getByRole("list", { name })).toBeInTheDocument()
    }
  },
}

export const Dark: Story = {
  globals: { theme: "dark" },
}

export const RightToLeft: Story = {
  globals: { dir: "rtl" },
}
