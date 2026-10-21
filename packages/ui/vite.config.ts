/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: [
            "src/**/*.test.ts",
            "test/**/*.test.ts",
            "tests/**/*.test.ts",
          ],
        },
      },
    ],
  },
})
