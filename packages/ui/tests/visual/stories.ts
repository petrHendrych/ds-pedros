export interface IndexEntry {
  type: "story" | "docs"
  id: string
  title: string
  name: string
  tags?: string[]
}

export interface StoryIndex {
  v: number
  entries: Record<string, IndexEntry>
}

export const NO_VR_TAG = "no-vr"

export function visualStories(index: StoryIndex): IndexEntry[] {
  return Object.values(index.entries)
    .filter(
      (entry) =>
        entry.type === "story" && !(entry.tags ?? []).includes(NO_VR_TAG),
    )
    .sort((a, b) => a.id.localeCompare(b.id))
}
