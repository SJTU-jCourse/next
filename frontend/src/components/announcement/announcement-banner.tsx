import { useState } from "react"
import {
  RiCloseLine,
  RiExternalLinkLine,
  RiInformationLine,
} from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useAnnouncements } from "@/hooks/use-announcement"

const STORAGE_KEY = "jcourse:dismissed-announcements"

function getDismissed(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as number[])
  } catch {
    return new Set()
  }
}

function persistDismissed(ids: Set<number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)))
  } catch {
    // ignore
  }
}

export function AnnouncementBanner() {
  const { user, isLoading } = useAuth()
  const { data } = useAnnouncements(Boolean(user))
  const [dismissed, setDismissed] = useState(() => getDismissed())

  if (isLoading || !user) return null

  const visible = (data ?? []).filter((a) => !dismissed.has(a.id))
  if (visible.length === 0) return null

  function dismiss(id: number) {
    const next = new Set(dismissed)
    next.add(id)
    setDismissed(next)
    persistDismissed(next)
  }

  return (
    <div className="mb-6 space-y-2">
      {visible.map((a) => {
        const title = a.title.trim()
        const body = a.body.trim()
        const linkURL = a.link_url?.trim()
        const linkTitle = a.link_title?.trim() || linkURL

        if (!title && !body) return null

        return (
          <div
            key={a.id}
            role="note"
            aria-label={title || "公告"}
            className="flex items-center gap-3 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm"
          >
            <RiInformationLine
              aria-hidden
              className="size-4 shrink-0 text-primary"
            />
            <div className="min-w-0 flex-1">
              {title && <p className="font-medium text-primary">{title}</p>}
              {body && (
                <p
                  className={cn("text-sm whitespace-pre-line", title && "mt-1")}
                >
                  {body}
                </p>
              )}
              {linkURL && (
                <a
                  href={linkURL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex max-w-full items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  <span className="truncate">{linkTitle}</span>
                  <RiExternalLinkLine className="size-4 shrink-0" />
                </a>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              onClick={() => dismiss(a.id)}
              aria-label="关闭公告"
              title="关闭公告"
            >
              <RiCloseLine />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
