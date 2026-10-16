import { useEffect } from "react"
import { getRouteApi, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import {
  COURSE_ENROLLMENT_SYNC_CHANNEL,
  getSyncErrorMessage,
  getSyncSuccessMessage,
  type CourseEnrollmentSyncMessage,
} from "@/lib/course-enrollment-sync"

const routeApi = getRouteApi("/public/course/mine/sync-callback")

export function CourseEnrollmentSyncCallbackPage() {
  const search = routeApi.useSearch()
  const status = search.status === "ok" ? "ok" : "error"
  const semester = search.semester ?? ""
  const message = search.message
  const matched = search.matched ?? 0
  const total = search.total ?? 0

  useEffect(() => {
    const payload: CourseEnrollmentSyncMessage = {
      status,
      semester,
      message,
      matched,
      total,
    }
    const channel = new BroadcastChannel(COURSE_ENROLLMENT_SYNC_CHANNEL)
    channel.postMessage(payload)
    window.opener?.postMessage(
      { type: COURSE_ENROLLMENT_SYNC_CHANNEL, payload },
      window.location.origin
    )
    const timer = window.setTimeout(() => window.close(), 900)
    return () => {
      window.clearTimeout(timer)
      channel.close()
    }
  }, [matched, message, semester, status, total])

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">
          {status === "ok" ? "课表同步完成" : "课表同步失败"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {status === "ok"
            ? getSyncSuccessMessage(semester, matched)
            : getSyncErrorMessage(message)}
        </p>
        <Button asChild variant="outline">
          <Link
            to="/course/mine"
            search={{
              type: "enrolled",
              semester: semester && matched > 0 ? semester : undefined,
            }}
          >
            返回我的课程
          </Link>
        </Button>
      </div>
    </div>
  )
}
