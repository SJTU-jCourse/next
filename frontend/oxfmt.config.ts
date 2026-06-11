import { defineConfig } from "oxfmt"

export default defineConfig({
  endOfLine: "lf",
  semi: false,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "es5",
  printWidth: 80,
  ignorePatterns: [
    "node_modules/",
    "coverage/",
    ".pnpm-store/",
    "pnpm-lock.yaml",
    "package-lock.json",
    "yarn.lock",
  ],
  sortTailwindcss: {
    stylesheet: "src/index.css",
    functions: ["cn", "cva"],
  },
})
