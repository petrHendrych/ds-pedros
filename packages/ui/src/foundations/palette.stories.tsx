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
  const columns = [
    ...new Set(ramps.flatMap((ramp) => ramp.steps.map(({ step }) => step))),
  ].sort((a, b) => Number(a) - Number(b))

  // A swatch grid with values in tooltips keeps the text-node count low: axe's contrast check
  // walks every text node, once per visual-regression cell, and a label per swatch timed out CI.
  // Names sit on their own row and the layout is fixed, so the grid never overflows at 360px.
  return (
    <table className="w-full table-fixed border-separate border-spacing-1">
      <caption className="sr-only">Primitive color ramps</caption>
      <thead>
        <tr>
          {columns.map((step) => (
            <th
              key={step}
              scope="col"
              className="font-mono text-xs font-normal text-muted-foreground"
            >
              {step}
            </th>
          ))}
        </tr>
      </thead>
      {ramps.map((ramp) => (
        <tbody key={ramp.name}>
          <tr>
            <th
              scope="rowgroup"
              colSpan={columns.length}
              className="pt-3 text-start font-mono text-sm font-medium text-foreground"
            >
              {ramp.name}
            </th>
          </tr>
          <tr>
            {columns.map((step) => {
              const swatch = ramp.steps.find((entry) => entry.step === step)
              return (
                <td
                  key={step}
                  title={swatch && `${ramp.name}-${step}: ${swatch.value}`}
                >
                  {swatch && (
                    <span
                      className="block h-control-lg rounded-md border"
                      style={{ backgroundColor: `var(${swatch.variable})` }}
                    />
                  )}
                </td>
              )
            })}
          </tr>
        </tbody>
      ))}
    </table>
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
    const swatches = async (name: string) =>
      (await canvas.findByRole("rowheader", { name }))
        .closest("tbody")
        ?.querySelectorAll("td[title]").length
    await expect(await swatches("sunflower-gold")).toBe(11)
    for (const name of ["success", "error", "warning", "info"]) {
      await expect(await swatches(name)).toBe(11)
    }
  },
}

export const Dark: Story = {
  globals: { theme: "dark" },
}

export const RightToLeft: Story = {
  globals: { dir: "rtl" },
}
