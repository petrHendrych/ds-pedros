import type { Meta, StoryObj } from "@storybook/react-vite"
import { ArrowRight, Plus } from "lucide-react"
import { useState } from "react"
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
const FILLED = new Set(["default", "secondary", "destructive"])

/** A semantic color token's value, for comparing against computed styles. */
const token = (element: Element, name: string) =>
  getComputedStyle(element).getPropertyValue(`--ds-color-${name}`).trim()

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
    await expect(getComputedStyle(button).cursor).toBe("pointer")
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
    const button = canvas.getByRole("button")
    await expect(button).toBeDisabled()
    const style = getComputedStyle(button)
    await expect(style.cursor).toBe("not-allowed")
    await expect(style.opacity).toBe("1")
    await expect(style.backgroundColor).toBe(token(button, "disabled"))
    await expect(style.color).toBe(token(button, "disabled-foreground"))
  },
}

export const DisabledVariants: Story = {
  args: { disabled: true },
  render: Variants.render,
  play: async ({ canvas }) => {
    for (const variant of VARIANTS) {
      const button = canvas.getByRole("button", { name: variant })
      const style = getComputedStyle(button)
      await expect(style.color).toBe(token(button, "disabled-foreground"))
      if (FILLED.has(variant)) {
        await expect(style.backgroundColor).toBe(token(button, "disabled"))
      }
      if (variant === "outline") {
        await expect(style.borderTopColor).toBe(
          token(button, "disabled-border"),
        )
      }
    }
  },
}

export const Loading: Story = {
  args: { isLoading: true, children: "Saving" },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole("button", { name: "Saving" })
    await expect(button).toHaveAttribute("aria-busy", "true")
    await expect(button).toHaveAttribute("aria-disabled", "true")
    // aria-disabled, not native disabled: the button stays focusable while it loads.
    await expect(button).toBeEnabled()
    await expect(button.querySelector("svg[data-slot=spinner]")).toBeVisible()
    await expect(getComputedStyle(button).cursor).toBe("progress")
    await userEvent.click(button)
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}

export const LoadingVariants: Story = {
  args: { isLoading: true },
  render: Variants.render,
  play: async ({ canvas }) => {
    for (const variant of VARIANTS) {
      const button = canvas.getByRole("button", { name: variant })
      await expect(button).toHaveAttribute("aria-busy", "true")
      // Loading keeps the variant's colors; only disabled buttons turn grey.
      await expect(getComputedStyle(button).color).not.toBe(
        token(button, "disabled-foreground"),
      )
    }
  },
}

export const LoadingIconOnly: Story = {
  args: {
    size: "icon",
    isLoading: true,
    "aria-label": "Add item",
    children: <Plus aria-hidden />,
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Add item" })
    // The spinner replaces the icon instead of squeezing in beside it.
    await expect(button.querySelectorAll("svg")).toHaveLength(1)
    await expect(button.querySelector("svg[data-slot=spinner]")).toBeVisible()
  },
}

function SaveButton() {
  const [isLoading, setIsLoading] = useState(false)
  return (
    <Button isLoading={isLoading} onClick={() => setIsLoading(true)}>
      {isLoading ? "Saving" : "Save"}
    </Button>
  )
}

export const LoadingKeepsFocus: Story = {
  render: () => <SaveButton />,
  play: async ({ canvas }) => {
    await userEvent.tab()
    await userEvent.keyboard("{Enter}")
    const button = canvas.getByRole("button", { name: "Saving" })
    await expect(button).toHaveAttribute("aria-busy", "true")
    await expect(button).toHaveFocus()
  },
}

const formSubmitted = fn()

export const LoadingSubmit: Story = {
  args: { type: "submit", isLoading: true, children: "Sending" },
  render: (args) => (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        formSubmitted()
      }}
    >
      <Button {...args} />
    </form>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Sending" }))
    // A loading submit button must not submit the form a second time.
    await expect(formSubmitted).not.toHaveBeenCalled()
  },
}

export const LoadingRightToLeft: Story = {
  globals: { dir: "rtl" },
  args: { isLoading: true, children: "جارٍ الحفظ" },
}

export const LoadingDark: Story = {
  tags: ["no-vr"],
  globals: { theme: "dark" },
  args: { isLoading: true },
  render: Variants.render,
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
  // No args spread: links have no loading state, and `isLoading` is a type error with asChild.
  render: () => (
    <Button asChild>
      <a href="#usage">Read the usage guide</a>
    </Button>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "Read the usage guide" })
    await expect(link).not.toHaveAttribute("type")
    await expect(link).toHaveAttribute("data-slot", "button")
    await expect(getComputedStyle(link).cursor).toBe("pointer")
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

export const LongLabelInRow: Story = {
  args: { children: "Save changes and continue to the payment details step" },
  render: (args) => (
    <div className="flex w-60 gap-2">
      <Button {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button")
    // Flex rows (card footers, toolbars) must shrink and wrap the label too.
    await expect(button.getBoundingClientRect().width).toBeLessThanOrEqual(240)
    await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth)
  },
}

export const UnbreakableLabel: Story = {
  args: { children: "Zahlungsbestätigungsübersichtsseitenaufruf" },
  render: (args) => (
    <div className="max-w-60">
      <Button {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button")
    await expect(button.getBoundingClientRect().width).toBeLessThanOrEqual(240)
    await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth)
  },
}

export const ShortLabel: Story = {
  args: { size: "sm", children: "1" },
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
