import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { Input } from "../input/input"
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "./field"

const meta = {
  title: "Components/Field",
  component: Field,
  tags: ["autodocs"],
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Field {...args} className="max-w-sm">
      <FieldLabel>Email</FieldLabel>
      <FieldControl>
        <Input type="email" />
      </FieldControl>
      <FieldDescription>We only use it for receipts.</FieldDescription>
    </Field>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText("Email")
    await expect(input).toHaveAttribute("data-slot", "input")
    await expect(input).toHaveAccessibleDescription(
      "We only use it for receipts.",
    )
    await expect(input).not.toHaveAttribute("aria-invalid")
  },
}

export const Invalid: Story = {
  args: { invalid: true },
  render: (args) => (
    <Field {...args} className="max-w-sm">
      <FieldLabel>Email</FieldLabel>
      <FieldControl>
        <Input type="email" defaultValue="not-an-email" />
      </FieldControl>
      <FieldDescription>We only use it for receipts.</FieldDescription>
      <FieldError>Enter a valid email address.</FieldError>
    </Field>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText("Email")
    await expect(input).toBeInvalid()
    await expect(input).toHaveAccessibleDescription(
      "We only use it for receipts. Enter a valid email address.",
    )
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "Enter a valid email address.",
    )
  },
}

export const WithoutDescription: Story = {
  render: (args) => (
    <Field {...args} className="max-w-sm">
      <FieldLabel>Name</FieldLabel>
      <FieldControl>
        <Input />
      </FieldControl>
    </Field>
  ),
  play: async ({ canvas }) => {
    // Never point aria-describedby at elements that are not rendered.
    await expect(canvas.getByLabelText("Name")).not.toHaveAttribute(
      "aria-describedby",
    )
  },
}

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <Field {...args} className="max-w-sm">
      <FieldLabel>Email</FieldLabel>
      <FieldControl>
        <Input type="email" defaultValue="ada@example.com" />
      </FieldControl>
    </Field>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByLabelText("Email")).toBeDisabled()
    const field = canvasElement.querySelector("[data-slot=field]")
    await expect(field).toHaveAttribute("data-disabled")
  },
}

export const ErrorList: Story = {
  args: { invalid: true },
  render: (args) => (
    <Field {...args} className="max-w-sm">
      <FieldLabel>Password</FieldLabel>
      <FieldControl>
        <Input type="password" />
      </FieldControl>
      <FieldError
        errors={[
          { message: "Use at least 12 characters." },
          { message: "Include a number." },
          { message: "Use at least 12 characters." },
        ]}
      />
    </Field>
  ),
  play: async ({ canvas }) => {
    const items = within(canvas.getByRole("alert")).getAllByRole("listitem")
    await expect(items.map((item) => item.textContent)).toEqual([
      "Use at least 12 characters.",
      "Include a number.",
    ])
  },
}

export const Group: Story = {
  render: () => (
    <FieldGroup className="max-w-sm">
      <Field>
        <FieldLabel>First name</FieldLabel>
        <FieldControl>
          <Input autoComplete="given-name" />
        </FieldControl>
      </Field>
      <Field>
        <FieldLabel>Last name</FieldLabel>
        <FieldControl>
          <Input autoComplete="family-name" />
        </FieldControl>
      </Field>
    </FieldGroup>
  ),
  play: async ({ canvas }) => {
    const first = canvas.getByLabelText("First name")
    const last = canvas.getByLabelText("Last name")
    await expect(first.id).not.toBe(last.id)
  },
}

export const RightToLeft: Story = {
  globals: { dir: "rtl" },
  render: () => (
    <Field className="max-w-sm">
      <FieldLabel>البريد الإلكتروني</FieldLabel>
      <FieldControl>
        <Input type="email" />
      </FieldControl>
      <FieldDescription>نستخدمه فقط للإيصالات.</FieldDescription>
    </Field>
  ),
}

export const Dark: Story = {
  tags: ["no-vr"],
  globals: { theme: "dark" },
  args: { invalid: true },
  render: Invalid.render,
}
