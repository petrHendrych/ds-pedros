---
"@petrhendrych/ui": patch
---

Button, Input and Label use the `disabled`, `disabled-foreground` and `disabled-border` tokens for
their disabled state instead of 50% opacity. Buttons show a pointer cursor (a not-allowed cursor when
disabled), and the file input's "Choose file" button shows a pointer cursor.
