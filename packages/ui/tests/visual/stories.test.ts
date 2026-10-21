import { describe, expect, it } from "vitest"
import { visualStories, type StoryIndex } from "./stories"

describe("visualStories", () => {
  it("keeps stories, drops docs entries and no-vr stories, sorted by id", () => {
    const index: StoryIndex = {
      v: 5,
      entries: {
        "b--one": {
          type: "story",
          id: "b--one",
          title: "B",
          name: "One",
          tags: [],
        },
        "a--docs": {
          type: "docs",
          id: "a--docs",
          title: "A",
          name: "Docs",
          tags: [],
        },
        "a--two": { type: "story", id: "a--two", title: "A", name: "Two" },
        "a--dark": {
          type: "story",
          id: "a--dark",
          title: "A",
          name: "Dark",
          tags: ["no-vr"],
        },
      },
    }
    expect(visualStories(index).map((entry) => entry.id)).toEqual([
      "a--two",
      "b--one",
    ])
  })
})
