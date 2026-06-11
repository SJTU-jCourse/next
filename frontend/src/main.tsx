import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { registerSW } from "virtual:pwa-register"

import "./index.css"
import App from "./App.tsx"
import { brand } from "@/config/brand"

document.title = brand.name

function registerPwaServiceWorker() {
  if (!import.meta.env.PROD) return
  if (!("serviceWorker" in navigator)) return

  registerSW({
    immediate: true,
    onRegisteredSW(_scriptUrl, registration) {
      if (!registration) return

      window.setInterval(
        () => {
          void registration.update()
        },
        60 * 60 * 1000
      )
    },
  })
}

async function enableMocking() {
  if (!import.meta.env.DEV) return
  if (import.meta.env.VITE_ENABLE_MOCKS !== "true") return

  const { worker } = await import("./mocks/browser")
  await worker.start({ onUnhandledRequest: "bypass" })
}

void enableMocking().then(() => {
  registerPwaServiceWorker()

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})
