import { describe, expect, it } from "vitest"
import { HEADER } from "../src/header.ts"

describe("generated-file header", () => {
  it("is a single block comment that closes only at its end", () => {
    expect(HEADER.startsWith("/*")).toBe(true)
    expect(HEADER.indexOf("*/")).toBe(HEADER.trimEnd().length - 2)
  })
})
