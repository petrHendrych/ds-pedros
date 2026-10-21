export const DEFAULT_BRAND = "acme"
export const VR_WIDTHS = [360, 768, 1280, 1536] as const
const THEMES = ["light", "dark"] as const

export interface Cell {
  brand: string
  theme: (typeof THEMES)[number]
  /** null keeps the device profile's own viewport. */
  width: number | null
}

/** Tiered matrix from the spec (Q21). */
export function cellsFor(project: string, brands: readonly string[]): Cell[] {
  const otherBrands = brands.filter((brand) => brand !== DEFAULT_BRAND)
  switch (project) {
    case "chromium":
      return [
        ...VR_WIDTHS.flatMap((width) =>
          THEMES.map((theme) => ({ brand: DEFAULT_BRAND, theme, width })),
        ),
        ...otherBrands.flatMap((brand) =>
          THEMES.map((theme) => ({ brand, theme, width: 1280 })),
        ),
      ]
    case "firefox":
    case "webkit":
      return [360, 1280].map((width) => ({
        brand: DEFAULT_BRAND,
        theme: "light" as const,
        width,
      }))
    case "mobile-safari":
    case "mobile-chrome":
      return [{ brand: DEFAULT_BRAND, theme: "light", width: null }]
    default:
      throw new Error(
        `No visual-regression tier defined for project "${project}"`,
      )
  }
}

export function cellName(cell: Cell): string {
  return `${cell.brand}-${cell.theme}-${cell.width ?? "device"}.png`
}
