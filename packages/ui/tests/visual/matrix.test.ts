import { describe, expect, it } from "vitest"
import { cellName, cellsFor, VR_WIDTHS } from "./matrix"

const BRANDS = ["acme", "nova"] as const

describe("visual-regression matrix", () => {
  it("tier A + C: chromium covers every width and theme for the default brand, other brands at 1280", () => {
    const cells = cellsFor("chromium", BRANDS)
    expect(cells.filter((cell) => cell.brand === "acme")).toHaveLength(
      VR_WIDTHS.length * 2,
    )
    expect(cells).toContainEqual({ brand: "acme", theme: "dark", width: 360 })
    expect(cells.filter((cell) => cell.brand === "nova")).toEqual([
      { brand: "nova", theme: "light", width: 1280 },
      { brand: "nova", theme: "dark", width: 1280 },
    ])
  })

  it("tier B: other desktop engines take 360 and 1280 in light", () => {
    for (const project of ["firefox", "webkit"]) {
      expect(cellsFor(project, BRANDS)).toEqual([
        { brand: "acme", theme: "light", width: 360 },
        { brand: "acme", theme: "light", width: 1280 },
      ])
    }
  })

  it("tier B: mobile profiles keep their device viewport", () => {
    expect(cellsFor("mobile-safari", BRANDS)).toEqual([
      { brand: "acme", theme: "light", width: null },
    ])
    expect(cellName({ brand: "acme", theme: "light", width: null })).toBe(
      "acme-light-device.png",
    )
  })

  it("refuses projects without a tier", () => {
    expect(() => cellsFor("edge", BRANDS)).toThrow(/No visual-regression tier/)
  })
})
