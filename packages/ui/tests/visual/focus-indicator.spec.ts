import { expect, test } from "@playwright/test"

for (const forcedColors of ["none", "active"] as const) {
  test(`keyboard focus shows a 2px outline (forced colors: ${forcedColors})`, async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "forced-colors emulation is Chromium-only",
    )
    await page.emulateMedia({ forcedColors })
    await page.goto("/iframe.html?id=components-button--default&viewMode=story")
    await page.keyboard.press("Tab")
    const button = page.getByRole("button", { name: "Button" })
    await expect(button).toBeFocused()
    await expect(button).toHaveCSS("outline-style", "solid")
    await expect(button).toHaveCSS("outline-width", "2px")
  })
}
