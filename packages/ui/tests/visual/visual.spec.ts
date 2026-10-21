import { readFileSync } from "node:fs"
import path from "node:path"
import { brands } from "@petrhendrych/tokens"
import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { cellName, cellsFor } from "./matrix"
import { visualStories, type StoryIndex } from "./stories"

const indexPath = path.resolve(
  import.meta.dirname,
  "../../storybook-static/index.json",
)
const stories = visualStories(
  JSON.parse(readFileSync(indexPath, "utf8")) as StoryIndex,
)
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]

/** Storybook's a11y addon runs axe after each render; wait for it instead of colliding. */
async function axeViolations(page: Page) {
  for (let attempt = 0; ; attempt++) {
    try {
      const { violations } = await new AxeBuilder({ page })
        .include("#storybook-root")
        .withTags(WCAG_TAGS)
        .analyze()
      return violations
    } catch (error) {
      if (attempt >= 50 || !String(error).includes("Axe is already running"))
        throw error
      await page.waitForTimeout(100)
    }
  }
}

for (const story of stories) {
  test(`${story.title} › ${story.name}`, async ({ page }, testInfo) => {
    for (const cell of cellsFor(testInfo.project.name, brands)) {
      if (cell.width !== null)
        await page.setViewportSize({ width: cell.width, height: 900 })
      await page.goto(
        `/iframe.html?id=${story.id}&viewMode=story&globals=brand:${cell.brand};theme:${cell.theme}`,
      )
      await page.locator("#storybook-root > *").first().waitFor()
      await page.evaluate(() => document.fonts.ready)
      await expect
        .soft(page)
        .toHaveScreenshot([story.id, cellName(cell)], { fullPage: true })

      if (testInfo.project.name === "chromium") {
        expect
          .soft(await axeViolations(page), `${story.id} ${cellName(cell)}`)
          .toEqual([])
      }
    }
  })
}
