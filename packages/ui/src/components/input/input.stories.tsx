import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent } from "storybook/test"

import { Input } from "./input"

/** A semantic color token's value, for comparing against computed styles. */
const token = (element: Element, name: string) =>
  getComputedStyle(element).getPropertyValue(`--ds-color-${name}`).trim()

const meta = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
  args: { "aria-label": "Email", type: "email" },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Email" })
    await userEvent.type(input, "ada@example.com")
    await expect(input).toHaveValue("ada@example.com")
    await expect(input).toHaveAttribute("data-slot", "input")
  },
}

export const Placeholder: Story = {
  args: { placeholder: "name@example.com" },
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "ada@example.com" },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox")
    await expect(input).toBeDisabled()
    const style = getComputedStyle(input)
    await expect(style.cursor).toBe("not-allowed")
    await expect(style.opacity).toBe("1")
    await expect(style.backgroundColor).toBe(token(input, "disabled"))
    await expect(style.color).toBe(token(input, "disabled-foreground"))
    await expect(style.borderTopColor).toBe(token(input, "disabled-border"))
  },
}

export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "not-an-email" },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox")
    await expect(input).toBeInvalid()
    await expect(getComputedStyle(input).borderTopColor).toBe(
      getComputedStyle(input).getPropertyValue("--ds-color-destructive").trim(),
    )
  },
}

export const File: Story = {
  args: { type: "file", "aria-label": "Attachment" },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector("input[type=file]")
    if (!input) throw new Error("file input did not render")
    await expect(getComputedStyle(input, "::file-selector-button").cursor).toBe(
      "pointer",
    )
  },
}

export const NarrowContainer: Story = {
  args: { defaultValue: "a.very.long.email.address@example-company.com" },
  render: (args) => (
    <div className="max-w-60">
      <Input {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("textbox").getBoundingClientRect().width,
    ).toBeLessThanOrEqual(240)
  },
}

export const RightToLeft: Story = {
  globals: { dir: "rtl" },
  args: { "aria-label": "البريد الإلكتروني", placeholder: "name@example.com" },
}

export const Dark: Story = {
  tags: ["no-vr"],
  globals: { theme: "dark" },
  args: { placeholder: "name@example.com" },
}
