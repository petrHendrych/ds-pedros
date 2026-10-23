# @petrhendrych/ui

## 0.2.1

### Patch Changes

- c99676e: Replace the leftover "Acme" in the package descriptions with "ds-pedros".
- Updated dependencies [c99676e]
  - @petrhendrych/tokens@0.2.2

## 0.2.0

### Minor Changes

- ffed46b: Add `isLoading` to Button. It shows a spinner before the label (replacing the icon on icon sizes), sets
  `aria-busy` and `aria-disabled`, and ignores clicks and form submission while keeping focus. It can't
  be combined with `asChild`, which is a type error.

### Patch Changes

- 5d8587d: Button, Input and Label use the `disabled`, `disabled-foreground` and `disabled-border` tokens for
  their disabled state instead of 50% opacity. Buttons show a pointer cursor (a not-allowed cursor when
  disabled), and the file input's "Choose file" button shows a pointer cursor.
- a865aaf: Replace the leftover "Acme" in the package descriptions with "ds-pedros".
- Updated dependencies [a865aaf]
  - @petrhendrych/tokens@0.2.1

## 0.1.1

### Patch Changes

- Updated dependencies [97d9f17]
  - @petrhendrych/tokens@0.2.0

## 0.1.0

### Minor Changes

- 57efb43: Initial release: DTCG tokens for the acme and nova brands (light/dark) with a Tailwind v4 theme, and the first owned component, Button.
- 0b82535: Add Input, Label, Field (FieldLabel, FieldControl, FieldDescription, FieldError, FieldGroup) and Card (CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter). Field wires ids, descriptions and errors to its control automatically.

### Patch Changes

- Updated dependencies [57efb43]
  - @petrhendrych/tokens@0.1.0
