import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/index.ts"],
  // One output file per module keeps per-file "use client" directives intact.
  unbundle: true,
  format: "esm",
  platform: "neutral",
  dts: true,
  sourcemap: true,
})
