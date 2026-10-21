import { describe, expect, it } from "vitest"
import { cn } from "./cn"

describe("cn", () => {
  it("joins conditional classes", () => {
    expect(cn("a", null, undefined, { b: false, c: true })).toBe("a c")
  })

  it("lets later token utilities win over conflicting ones", () => {
    expect(cn("bg-primary", "bg-secondary")).toBe("bg-secondary")
    expect(cn("h-8", "h-control-md")).toBe("h-control-md")
    expect(cn("min-h-control-sm", "min-h-control-lg")).toBe("min-h-control-lg")
    expect(cn("size-control-sm", "size-control-md")).toBe("size-control-md")
    expect(cn("rounded-md", "rounded-lg")).toBe("rounded-lg")
  })

  it("keeps font size and text color apart", () => {
    expect(cn("text-sm", "text-muted-foreground")).toBe(
      "text-sm text-muted-foreground",
    )
  })
})
