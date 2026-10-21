import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

const dist = path.resolve(import.meta.dirname, "../dist")
const failures: string[] = []
const USE_CLIENT = /^(\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*["']use client["']/

function read(file: string): string {
  const full = path.join(dist, file)
  if (!existsSync(full)) {
    failures.push(`missing dist/${file}`)
    return ""
  }
  return readFileSync(full, "utf8")
}

const index = read("index.js")
for (const name of [
  "Button",
  "buttonVariants",
  "cn",
  "Input",
  "Label",
  "Field",
  "FieldControl",
  "FieldDescription",
  "FieldError",
  "FieldGroup",
  "FieldLabel",
  "Card",
  "CardAction",
  "CardContent",
  "CardDescription",
  "CardFooter",
  "CardHeader",
  "CardTitle",
]) {
  if (!new RegExp(`\\b${name}\\b`).test(index))
    failures.push(`dist/index.js does not export ${name}`)
}
if (!read("index.d.ts").includes("ButtonProps"))
  failures.push("dist/index.d.ts lacks ButtonProps")
// Interactive components must stay client components after bundling.
for (const file of [
  "components/button/button.js",
  "components/label/label.js",
  "components/field/field.js",
]) {
  if (!USE_CLIENT.test(read(file)))
    failures.push(`dist/${file} must start with "use client"`)
}
// Server Components call variant helpers (e.g. <Link className={buttonVariants()} />), so they must not be client references.
for (const file of [
  "lib/cn.js",
  "components/button/button-variants.js",
  "components/input/input.js",
  "components/card/card.js",
]) {
  if (read(file).includes("use client"))
    failures.push(`dist/${file} must stay server-safe (no "use client")`)
}
if (!/from "\.\/components\/button\/button-variants\.js"/.test(index)) {
  failures.push(
    "dist/index.js must export buttonVariants from the server-safe button-variants module",
  )
}

if (failures.length > 0) {
  console.error(failures.join("\n"))
  process.exit(1)
}
console.log("@petrhendrych/ui dist OK")
