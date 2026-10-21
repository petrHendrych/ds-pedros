import path from "node:path"
import js from "@eslint/js"
import prettier from "eslint-config-prettier/flat"
import betterTailwindcss from "eslint-plugin-better-tailwindcss"
import jsxA11yX from "eslint-plugin-jsx-a11y-x"
import reactHooks from "eslint-plugin-react-hooks"
import storybook from "eslint-plugin-storybook"
import { defineConfig, globalIgnores } from "eslint/config"
import globals from "globals"
import tseslint from "typescript-eslint"

/** Block-axis and sizing utilities do not flip in RTL; only inline-axis physical classes do. */
const DIRECTION_AGNOSTIC = [
  "^(.*:)?-?(m|p|scroll-m|scroll-p)(t|b)-",
  "^(.*:)?-?(top|bottom)-",
  "^(.*:)?border-(t|b)(-|$)",
  "^(.*:)?(min-|max-)?(h|w)-",
  "^(.*:)?size-",
]

export default defineConfig([
  globalIgnores([
    "**/dist",
    "**/storybook-static",
    "**/playwright-report",
    "**/test-results",
  ]),
  {
    files: ["**/*.{js,ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ["packages/ui/**/*.tsx"],
    extends: [
      reactHooks.configs.flat.recommended,
      jsxA11yX.configs.recommended,
    ],
  },
  {
    files: ["packages/ui/src/**/*.tsx", "packages/ui/.storybook/**/*.tsx"],
    plugins: { "better-tailwindcss": betterTailwindcss },
    settings: {
      "better-tailwindcss": {
        cwd: path.join(import.meta.dirname, "packages/ui"),
        entryPoint: ".storybook/preview.css",
      },
    },
    rules: {
      "better-tailwindcss/no-unknown-classes": "error",
      "better-tailwindcss/no-conflicting-classes": "error",
      "better-tailwindcss/no-duplicate-classes": "error",
      "better-tailwindcss/no-deprecated-classes": "error",
      "better-tailwindcss/enforce-logical-properties": [
        "error",
        { ignore: DIRECTION_AGNOSTIC },
      ],
      "better-tailwindcss/no-restricted-classes": [
        "error",
        {
          restrict: [
            {
              pattern: "\\[[^\\[\\]]*\\](?!:)",
              message:
                "Arbitrary values bypass the design tokens. Use a token utility or propose a new token.",
            },
            {
              pattern: "\\(--[^)]*\\)",
              message:
                "CSS-variable shorthands bypass the design tokens. Use a token utility.",
            },
          ],
        },
      ],
    },
  },
  ...storybook.configs["flat/recommended"],
  prettier,
])
