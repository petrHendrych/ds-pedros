---
"@petrhendrych/ui": minor
---

Add `isLoading` to Button. It shows a spinner before the label (replacing the icon on icon sizes), sets
`aria-busy` and `aria-disabled`, and ignores clicks and form submission while keeping focus. It can't
be combined with `asChild`, which is a type error.
