import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent } from "storybook/test"

import { Input } from "../input/input"
import { Label } from "./label"

const meta = {
  title: "Components/Label",
  component: Label,
  tags: ["autodocs"],
  args: { children: "Email" },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const WithInput: Story = {
  render: (args) => (
    <div className="flex max-w-sm flex-col gap-2">
      <Label {...args} htmlFor="label-email" />
      <Input id="label-email" type="email" />
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText("Email"))
    await expect(canvas.getByLabelText("Email")).toHaveFocus()
  },
}

export const DisabledPeer: Story = {
  render: (args) => (
    <div className="flex max-w-sm items-center gap-2">
      <Input
        id="label-disabled"
        disabled
        className="peer w-auto"
        aria-label="Disabled email"
      />
      <Label {...args} htmlFor="label-disabled" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(getComputedStyle(canvas.getByText("Email")).opacity).toBe(
      "0.5",
    )
  },
}
