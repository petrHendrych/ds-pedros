/**
 * Upstream: shadcn/ui `field`, style `radix-nova`, shadcn CLI 4.22.1 (subset).
 * Review upstream changes with `pnpm dlx shadcn@latest add field --diff` (never `--overwrite`).
 * Deviations:
 *  - Field wires its parts together: it generates ids, FieldLabel gets `htmlFor`, and the new
 *    FieldControl passes `id`, `aria-describedby`, `aria-invalid` and `disabled` to its child
 *  - aria-describedby only references a FieldDescription / FieldError that is actually rendered
 *  - `invalid` and `disabled` props on Field replace upstream's manual `data-invalid` / `data-disabled`
 *  - included parts: Field, FieldLabel, FieldControl, FieldDescription, FieldError, FieldGroup
 *    (FieldSet, FieldLegend, FieldSeparator, FieldContent, FieldTitle and orientations come with
 *    checkbox and radio controls)
 *  - no arbitrary values or physical directions (`ms-4` list indent)
 */
"use client"

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  type ComponentProps,
} from "react"
import { Slot } from "radix-ui"

import { cn } from "../../lib/cn"
import { Label } from "../label/label"

type FieldPart = "description" | "error"

interface FieldContextValue {
  controlId: string
  descriptionId: string
  errorId: string
  invalid: boolean
  disabled: boolean
  rendered: Record<FieldPart, boolean>
  register: (part: FieldPart) => () => void
}

const FieldContext = createContext<FieldContextValue | null>(null)

function useField(component: string): FieldContextValue {
  const field = useContext(FieldContext)
  if (!field) throw new Error(`<${component}> must be used inside <Field>`)
  return field
}

type FieldProps = ComponentProps<"div"> & {
  /** Marks the control invalid (aria-invalid) and colors the label. */
  invalid?: boolean
  /** Disables the control and dims the label. */
  disabled?: boolean
}

function Field({
  className,
  invalid = false,
  disabled = false,
  ...props
}: FieldProps) {
  const id = useId()
  const [counts, setCounts] = useState<Record<FieldPart, number>>({
    description: 0,
    error: 0,
  })
  const register = useCallback((part: FieldPart) => {
    setCounts((current) => ({ ...current, [part]: current[part] + 1 }))
    return () =>
      setCounts((current) => ({ ...current, [part]: current[part] - 1 }))
  }, [])
  const value = useMemo<FieldContextValue>(
    () => ({
      controlId: `${id}-control`,
      descriptionId: `${id}-description`,
      errorId: `${id}-error`,
      invalid,
      disabled,
      rendered: {
        description: counts.description > 0,
        error: counts.error > 0,
      },
      register,
    }),
    [id, invalid, disabled, counts, register],
  )

  return (
    <FieldContext value={value}>
      <div
        role="group"
        data-slot="field"
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        className={cn(
          "group/field flex w-full flex-col gap-2 data-invalid:text-destructive",
          className,
        )}
        {...props}
      />
    </FieldContext>
  )
}

function FieldLabel({ className, ...props }: ComponentProps<typeof Label>) {
  const { controlId } = useField("FieldLabel")
  return (
    <Label
      data-slot="field-label"
      htmlFor={controlId}
      className={cn("w-fit leading-snug", className)}
      {...props}
    />
  )
}

/** Wraps one control (e.g. Input) and gives it the field's id, description, invalid and disabled state. */
function FieldControl(props: ComponentProps<typeof Slot.Root>) {
  const field = useField("FieldControl")
  const describedBy =
    [
      field.rendered.description ? field.descriptionId : null,
      field.rendered.error ? field.errorId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined
  // Slot's types only cover global HTML attributes; `disabled` is meant for the control it wraps.
  const controlProps: Record<string, unknown> = {
    id: field.controlId,
    "aria-describedby": describedBy,
    "aria-invalid": field.invalid || undefined,
    disabled: field.disabled || undefined,
  }
  return <Slot.Root {...controlProps} {...props} />
}

function FieldDescription({ className, ...props }: ComponentProps<"p">) {
  const { descriptionId, register } = useField("FieldDescription")
  useLayoutEffect(() => register("description"), [register])
  return (
    <p
      id={descriptionId}
      data-slot="field-description"
      className={cn(
        "text-sm leading-normal font-normal text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

type FieldErrorProps = ComponentProps<"div"> & {
  /** Validation errors (e.g. from react-hook-form); duplicates are shown once. */
  errors?: Array<{ message?: string } | undefined>
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: FieldErrorProps) {
  const { errorId, register } = useField("FieldError")
  const messages = [
    ...new Set(
      (errors ?? [])
        .map((error) => error?.message)
        .filter((message) => !!message),
    ),
  ]
  const content =
    children ??
    (messages.length === 1 ? (
      messages[0]
    ) : messages.length > 1 ? (
      <ul className="ms-4 flex list-disc flex-col gap-1">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    ) : null)
  const hasContent =
    content !== null && content !== undefined && content !== false

  useLayoutEffect(
    () => (hasContent ? register("error") : undefined),
    [hasContent, register],
  )

  if (!hasContent) return null
  return (
    <div
      id={errorId}
      role="alert"
      data-slot="field-error"
      className={cn("text-sm font-normal text-destructive", className)}
      {...props}
    >
      {content}
    </div>
  )
}

function FieldGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "@container/field-group flex w-full flex-col gap-5",
        className,
      )}
      {...props}
    />
  )
}

export {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  type FieldErrorProps,
  type FieldProps,
}
