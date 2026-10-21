import type { Meta, StoryObj } from "@storybook/react-vite"
import { ArrowRight, Plus } from "lucide-react"
import { expect, fn, userEvent } from "storybook/test"

import { Button } from "./button"

const VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const
const SIZES = ["sm", "md", "lg"] as const

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Button", onClick: fn() },
  argTypes: {
    variant: { control: "select", options: VARIANTS },
    size: {
      control: "select",
      options: [...SIZES, "icon-sm", "icon", "icon-lg"],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole("button", { name: "Button" })
    await expect(button).toHaveAttribute("type", "button")
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-4">
      {VARIANTS.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      {SIZES.map((size) => (
        <Button key={size} {...args} size={size}>
          Size {size}
        </Button>
      ))}
    </div>
  ),
}

export const WithIcon: Story = {
  args: {
    children: (
      <>
        Continue
        <ArrowRight aria-hidden className="rtl:rotate-180" />
      </>
    ),
  },
}

export const IconOnly: Story = {
  args: {
    size: "icon",
    "aria-label": "Add item",
    children: <Plus aria-hidden />,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Add item" })).toBeVisible()
  },
}

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button")).toBeDisabled()
  },
}

export const Keyboard: Story = {
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole("button")
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await userEvent.keyboard(" ")
    await expect(args.onClick).toHaveBeenCalledTimes(2)
  },
}

export const AsLink: Story = {
  render: (args) => (
    <Button {...args} asChild>
      <a href="#usage">Read the usage guide</a>
    </Button>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "Read the usage guide" })
    await expect(link).not.toHaveAttribute("type")
    await expect(link).toHaveAttribute("data-slot", "button")
  },
}

export const LongLabel: Story = {
  args: { children: "Save changes and continue to the payment details step" },
  render: (args) => (
    <div className="max-w-60">
      <Button {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button")
    // Narrow containers wrap the label instead of overflowing it.
    await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth)
    await expect(button.getBoundingClientRect().width).toBeLessThanOrEqual(240)
  },
}

export const RightToLeft: Story = {
  globals: { dir: "rtl" },
  args: {
    children: (
      <>
        متابعة
        <ArrowRight aria-hidden className="rtl:rotate-180" />
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector("[data-ds-scope]"),
    ).toHaveAttribute("dir", "rtl")
  },
}

export const Dark: Story = {
  tags: ["no-vr"],
  globals: { theme: "dark" },
  render: Variants.render,
}
