import "@fontsource-variable/inter"
import "@fontsource-variable/geist"
import "./preview.css"

import acmeCss from "@acme/tokens/brands/acme.css?inline"
import novaCss from "@acme/tokens/brands/nova.css?inline"
import type { Decorator, Preview } from "@storybook/react-vite"

const BRAND_CSS = { acme: acmeCss, nova: novaCss }
type Brand = keyof typeof BRAND_CSS

const isBrand = (value: unknown): value is Brand =>
  typeof value === "string" && value in BRAND_CSS

/** Brands are separate stylesheets in production, so only one is active at a time here too. */
function applyBrandStylesheet(brand: Brand): void {
  let style = document.querySelector<HTMLStyleElement>("style[data-ds-brand]")
  if (!style) {
    style = document.createElement("style")
    style.dataset.dsBrand = ""
    document.head.append(style)
  }
  if (style.dataset.dsBrand !== brand) {
    style.dataset.dsBrand = brand
    style.textContent = BRAND_CSS[brand]
  }
}

const withDesignSystem: Decorator = (Story, context) => {
  const brand = isBrand(context.globals.brand) ? context.globals.brand : "acme"
  const theme = context.globals.theme === "dark" ? "dark" : "light"
  const dir = context.globals.dir === "rtl" ? "rtl" : "ltr"
  applyBrandStylesheet(brand)
  if (context.viewMode === "story") {
    // Portals (dialogs, popovers) render outside the scope div and read the theme from <html>.
    document.documentElement.dataset.theme = theme
    document.documentElement.dir = dir
  }
  return (
    <div
      data-ds-scope=""
      data-theme={theme}
      dir={dir}
      lang={dir === "rtl" ? "ar" : "en"}
      className="bg-background text-foreground"
    >
      <Story />
    </div>
  )
}

const preview: Preview = {
  decorators: [withDesignSystem],
  globalTypes: {
    brand: {
      description: "Brand",
      toolbar: {
        title: "Brand",
        icon: "paintbrush",
        items: [
          { value: "acme", title: "Acme" },
          { value: "nova", title: "Nova" },
        ],
        dynamicTitle: true,
      },
    },
    theme: {
      description: "Color theme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
    dir: {
      description: "Text direction",
      toolbar: {
        title: "Direction",
        icon: "transfer",
        items: [
          { value: "ltr", title: "LTR" },
          { value: "rtl", title: "RTL" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { brand: "acme", theme: "light", dir: "ltr" },
  parameters: {
    layout: "padded",
    a11y: { test: "error" },
    viewport: {
      options: {
        mobile: {
          name: "Mobile 360",
          styles: { width: "360px", height: "780px" },
          type: "mobile",
        },
        tablet: {
          name: "Tablet 768",
          styles: { width: "768px", height: "1024px" },
          type: "tablet",
        },
        desktop: {
          name: "Desktop 1280",
          styles: { width: "1280px", height: "800px" },
          type: "desktop",
        },
        wide: {
          name: "Wide 1536",
          styles: { width: "1536px", height: "900px" },
          type: "desktop",
        },
      },
    },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
  },
}

export default preview
