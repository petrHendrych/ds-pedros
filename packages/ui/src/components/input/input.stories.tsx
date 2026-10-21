import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent } from "storybook/test"

import { Input } from "./input"

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
    await expect(canvas.getByRole("textbox")).toBeDisabled()
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
