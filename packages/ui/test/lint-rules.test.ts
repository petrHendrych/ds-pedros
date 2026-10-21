import path from "node:path"
import { ESLint } from "eslint"
import { describe, expect, it } from "vitest"

const repoRoot = path.resolve(import.meta.dirname, "../../..")
const eslint = new ESLint({ cwd: repoRoot })
const fixture = path.join(
  repoRoot,
  "packages/ui/src/components/fixture/fixture.tsx",
)

async function ruleIds(code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: fixture })
  return (result?.messages ?? []).map(
    (message) => message.ruleId ?? message.message,
  )
}

const withClass = (className: string) =>
  `export function Fixture() {\n  return <div className="${className}" />\n}\n`

describe("design-system lint rules", { timeout: 30_000 }, () => {
  it("accepts semantic token utilities", async () => {
    expect(
      await ruleIds(
        withClass(
          "bg-primary text-primary-foreground ps-4 min-h-control-md rounded-md",
        ),
      ),
    ).toEqual([])
  })

  it("rejects arbitrary values", async () => {
    expect(await ruleIds(withClass("bg-[#fff]"))).toContain(
      "better-tailwindcss/no-restricted-classes",
    )
  })

  it("rejects CSS-variable shorthands", async () => {
    expect(await ruleIds(withClass("bg-(--brand)"))).toContain(
      "better-tailwindcss/no-restricted-classes",
    )
  })

  it("rejects Tailwind's default palette", async () => {
    expect(await ruleIds(withClass("bg-red-500"))).toContain(
      "better-tailwindcss/no-unknown-classes",
    )
  })

  it("rejects physical inline-direction utilities", async () => {
    expect(await ruleIds(withClass("ml-2"))).toContain(
      "better-tailwindcss/enforce-logical-properties",
    )
    expect(await ruleIds(withClass("pr-4"))).toContain(
      "better-tailwindcss/enforce-logical-properties",
    )
  })

  it("allows direction-agnostic block and sizing utilities", async () => {
    expect(
      await ruleIds(withClass("mt-2 pb-4 h-control-md w-full size-4 max-w-60")),
    ).toEqual([])
  })

  it("requires alt text on images", async () => {
    expect(
      await ruleIds(`export const Img = () => <img src="x.png" />\n`),
    ).toContain("jsx-a11y-x/alt-text")
  })
})
