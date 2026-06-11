import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import { pwaOptions } from "./pwa.config"

const reactPackages = new Set([
  "@tanstack/react-query",
  "react",
  "react-dom",
  "react-router",
  "react-router-dom",
])
const contentPackages = new Set([
  "react-markdown",
  "rehype-sanitize",
  "remark-gfm",
])
const chartPackages = new Set(["recharts"])
const uiPackages = new Set([
  "@remixicon/react",
  "class-variance-authority",
  "clsx",
  "radix-ui",
  "tailwind-merge",
])

function getNodePackageName(id: string) {
  const packagePath = id.split(/[/\\]node_modules[/\\]/).pop()
  if (!packagePath || packagePath === id) return null

  const [scopeOrName, packageName] = packagePath.split(/[/\\]/)
  if (!scopeOrName) return null
  if (scopeOrName.startsWith("@")) return `${scopeOrName}/${packageName}`
  return scopeOrName
}

function isNodePackage(id: string, packages: Set<string>) {
  const packageName = getNodePackageName(id)
  return packageName ? packages.has(packageName) : false
}

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA(pwaOptions)],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (
            assetInfo.names.some((name) => /\.(woff2?|ttf|eot|otf)$/.test(name))
          )
            return "assets/fonts/[name].[ext]"
          return "assets/[name]-[hash][extname]"
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        codeSplitting: {
          groups: [
            {
              name: "vendor-react",
              test: (id) => isNodePackage(id, reactPackages),
              priority: 30,
            },
            {
              name: "vendor-markdown",
              test: (id) => isNodePackage(id, contentPackages),
              priority: 20,
            },
            {
              name: "vendor-charts",
              test: (id) => isNodePackage(id, chartPackages),
              priority: 20,
            },
            {
              name: "vendor-ui",
              test: (id) => isNodePackage(id, uiPackages),
              priority: 10,
            },
            {
              name: "vendor",
              test: /node_modules[\\/]/,
              entriesAware: true,
              minSize: 20 * 1024,
            },
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api/": {
        target: "https://course.sjtu.plus",
        changeOrigin: true,
      },
    },
  },
})
