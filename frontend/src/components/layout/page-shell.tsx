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
    <main className="mx-auto max-w-[1440px] px-3 py-6 sm:px-4">
      {showAnnouncements && <AnnouncementBanner />}
      {children}
    </main>
  )
}
