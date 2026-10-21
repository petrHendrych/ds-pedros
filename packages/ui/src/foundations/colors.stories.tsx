import { tokens } from "@petrhendrych/tokens"
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

export const NestedTheme: Story = {
  render: () => (
    <div data-testid="nested" data-theme="dark" className="border p-4">
      <ColorSwatches />
    </div>
  ),
  play: async ({ canvas }) => {
    const nested = canvas.getByTestId("nested")
    // Plain `border` inside a dark subtree must use the dark border token, not the page's.
    await expect(getComputedStyle(nested).borderTopColor).toBe(
      cssVar(nested, "--ds-color-border"),
    )
    await expect(cssVar(nested, "--ds-color-border")).toBe("oklch(0.269 0 0)")
  },
}
