import type { VitePWA } from "vite-plugin-pwa"

import { brand } from "./src/config/brand"

const appName = brand.name
const appDescription = brand.description

export const pwaOptions: Parameters<typeof VitePWA>[0] = {
  registerType: "autoUpdate",
  injectRegister: null,
  includeAssets: ["pwa-icon.svg", "pwa-192x192.png", "pwa-512x512.png"],
  manifest: {
    id: "/",
    name: appName,
    short_name: brand.shortName,
    description: appDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#0f766e",
    background_color: "#f8fafc",
    lang: "zh-CN",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "课程",
        short_name: "课程",
        description: "浏览和搜索课程",
        url: "/course",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "点评",
        short_name: "点评",
        description: "浏览课程点评",
        url: "/review",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "我的点评",
        short_name: "我的点评",
        description: "查看和管理我发布的点评",
        url: "/review/mine",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  },
  workbox: {
    cleanupOutdatedCaches: true,
    globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
    navigateFallback: "/index.html",
    navigateFallbackDenylist: [/^\/api\//],
  },
}
