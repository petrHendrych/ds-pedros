import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"

import { Button } from "../button/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card"

const meta = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

function ExampleCard({ action = false }: { action?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team plan</CardTitle>
        <CardDescription>Billed monthly, cancel anytime.</CardDescription>
        {action && (
          <CardAction>
            <Button variant="outline" size="sm">
              Change
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm">5 seats · 120 GB storage · priority support</p>
      </CardContent>
      <CardFooter>
        <Button variant="ghost">Cancel</Button>
        <Button>Upgrade to the annual plan</Button>
      </CardFooter>
    </Card>
  )
}

const box = (element: HTMLElement) => element.getBoundingClientRect()

export const Default: Story = {
  render: () => (
    <div className="max-w-md">
      <ExampleCard />
    </div>
  ),
  play: async ({ canvas }) => {
    // Titles are headings so screen-reader users can jump between cards.
    await expect(
      canvas.getByRole("heading", { level: 3, name: "Team plan" }),
    ).toBeVisible()
  },
}

export const HeadingLevel: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle as="h2">Team plan</CardTitle>
      </CardHeader>
    </Card>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { level: 2, name: "Team plan" }),
    ).toBeVisible()
  },
}

export const ActionBesideTitle: Story = {
  render: () => (
    <div className="max-w-md">
      <ExampleCard action />
    </div>
  ),
  play: async ({ canvas }) => {
    const title = box(canvas.getByRole("heading", { name: "Team plan" }))
    const action = box(canvas.getByRole("button", { name: "Change" }))
    // Wide card: the action sits in its own column to the end side of the title.
    await expect(action.left).toBeGreaterThan(title.right)
    await expect(action.top).toBeLessThan(title.bottom)
  },
}

export const ActionStackedWhenNarrow: Story = {
  render: () => (
    <div className="max-w-64">
      <ExampleCard action />
    </div>
  ),
  play: async ({ canvas }) => {
    const description = box(canvas.getByText("Billed monthly, cancel anytime."))
    const action = box(canvas.getByRole("button", { name: "Change" }))
    // Narrow card (container query): the action drops below the title and description.
    await expect(action.top).toBeGreaterThanOrEqual(description.bottom)
  },
}

export const FooterWraps: Story = {
  render: () => (
    <div className="max-w-64">
      <ExampleCard />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector<HTMLElement>("[data-slot=card]")
    if (!card) throw new Error("card not rendered")
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth)
  },
}

export const RightToLeft: Story = {
  globals: { dir: "rtl" },
  render: () => (
    <div className="max-w-md">
      <ExampleCard action />
    </div>
  ),
}

export const Dark: Story = {
  tags: ["no-vr"],
  globals: { theme: "dark" },
  render: ActionBesideTitle.render,
}
