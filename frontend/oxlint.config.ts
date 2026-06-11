import { defineConfig } from "oxlint"

export default defineConfig({
  env: {
    browser: true,
    es2020: true,
  },
  ignorePatterns: ["dist", "public/mockServiceWorker.js"],
  plugins: ["typescript", "react", "oxc", "unicorn"],
  settings: {
    react: {
      version: "19.2.6",
    },
  },
  options: {
    typeAware: true,
  },
  rules: {
    "react/exhaustive-deps": "error",
    "react/only-export-components": "error",
    "react/rules-of-hooks": "error",
    "typescript/no-deprecated": "error",
  },
  overrides: [
    {
      files: ["src/components/ui/**/*.{ts,tsx}", "src/contexts/**/*.{ts,tsx}"],
      rules: {
        "react/only-export-components": "off",
      },
    },
  ],
})
