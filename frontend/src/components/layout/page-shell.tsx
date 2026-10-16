import type { ReactNode } from "react"
import { AnnouncementBanner } from "@/components/announcement/announcement-banner"

interface PageShellProps {
  children: ReactNode
  showAnnouncements?: boolean
}

export function PageShell({
  children,
  showAnnouncements = true,
}: PageShellProps) {
  return (
    <main className="mx-auto max-w-360 px-4 py-6">
      {showAnnouncements && <AnnouncementBanner />}
      {children}
    </main>
  )
}
