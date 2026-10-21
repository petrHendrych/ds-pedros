import { expect, test } from "@playwright/test"

test("buttons offer a 44px target on coarse pointers", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, "touch profiles only")
  await page.goto("/iframe.html?id=components-button--default&viewMode=story")
  expect(
    await page.evaluate(() => matchMedia("(pointer: coarse)").matches),
  ).toBe(true)
  const box = await page.getByRole("button", { name: "Button" }).boundingBox()
  expect(box?.height).toBeGreaterThanOrEqual(44)
})

test("icon buttons offer a 44×44px target on coarse pointers", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, "touch profiles only")
  await page.goto("/iframe.html?id=components-button--icon-only&viewMode=story")
  const box = await page.getByRole("button", { name: "Add item" }).boundingBox()
  expect(box?.height).toBeGreaterThanOrEqual(44)
  expect(box?.width).toBeGreaterThanOrEqual(44)
})
