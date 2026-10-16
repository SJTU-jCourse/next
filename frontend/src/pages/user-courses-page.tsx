import { useEffect, useMemo, useState } from "react"
import { PageHeader } from "@/components/common/page-header"
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router"
import { RiMessage3Line, RiRefreshLine } from "@remixicon/react"
import { toast } from "sonner"
import { courseEnrollmentSyncStartURL } from "@/api/course"
import {
  COURSE_ENROLLMENT_SYNC_CHANNEL,
  getSyncErrorMessage,
  getSyncSuccessMessage,
  type CourseEnrollmentSyncMessage,
} from "@/lib/course-enrollment-sync"
import { toUserMessage } from "@/lib/error-message"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CourseList } from "@/components/course/course-list"
import { CourseEnrollmentList } from "@/components/course/course-enrollment-list"
import { CourseEnrollmentSyncDialog } from "@/components/course/course-enrollment-sync-dialog"
import { CourseNotificationDeleteAction } from "@/components/course/course-notification-delete-action"
import { PaginationComponent } from "@/components/common/pagination"
import { PageShell } from "@/components/layout/page-shell"
import { PageTitle } from "@/components/common/page-title"
import { useAuth } from "@/contexts/auth-context"
import {
  useCourseEnrollments,
  useCourseFilters,
  useFollowedCourses,
  useIgnoredCourses,
  useSetNotificationLevel,
} from "@/hooks/use-course"
import {
  getCurrentSemesterSetting,
  useSystemSettings,
} from "@/hooks/use-system-settings"
import { getDefaultSemester } from "@/lib/course-semesters"

const PAGE_SIZE = 20
const ALL = "__all__"
const routeApi = getRouteApi("/app/course/mine")

type View = "enrolled" | "followed" | "ignored"

export function UserCoursesPage() {
  const search = routeApi.useSearch()
  const navigate = useNavigate({ from: "/course/mine" })
  const typeParam = search.type
  const view: View =
    typeParam === "followed" || typeParam === "ignored" ? typeParam : "enrolled"
  const page = Math.max(1, search.page ?? 1)
  const semester = search.semester
  const filter = { page, page_size: PAGE_SIZE }
  const { user, isLoading: authLoading } = useAuth()
  const [syncOpen, setSyncOpen] = useState(false)
  const [syncSemester, setSyncSemester] = useState("")

  const enrolledCourses = useCourseEnrollments(!!user && view === "enrolled")
  const filtersQuery = useCourseFilters()
  const systemSettingsQuery = useSystemSettings(!!user)
  const followedCourses = useFollowedCourses(
    filter,
    !!user && view === "followed"
  )
  const ignoredCourses = useIgnoredCourses(filter, !!user && view === "ignored")
  const notificationMutation = useSetNotificationLevel()
  const syncSemesters = useMemo(
    () => filtersQuery.data?.semesters?.filter((item) => item.name) ?? [],
    [filtersQuery.data?.semesters]
  )
  const syncSemesterNames = useMemo(
    () => syncSemesters.map((item) => item.name),
    [syncSemesters]
  )
  const defaultSyncSemester = getDefaultSemester(
    syncSemesterNames,
    getCurrentSemesterSetting(systemSettingsQuery.data)
  )
  const enrolledItems = enrolledCourses.data ?? []
  const enrollmentSemesters = [
    ...new Set(enrolledItems.map((item) => item.semester)),
  ].sort((a, b) => b.localeCompare(a))
  const activeSemester =
    semester && enrollmentSemesters.includes(semester) ? semester : undefined
  const filteredEnrollments = activeSemester
    ? enrolledItems.filter((item) => item.semester === activeSemester)
    : enrolledItems
  const activeCourseQuery =
    view === "followed" ? followedCourses : ignoredCourses
  const title =
    view === "enrolled"
      ? "选课记录"
      : view === "followed"
        ? "已关注课程"
        : "已屏蔽课程"

  useEffect(() => {
    const handleMessage = (payload: CourseEnrollmentSyncMessage) => {
      if (payload.status === "ok") {
        void enrolledCourses.refetch()
        const matched = payload.matched ?? 0
        toast.success(getSyncSuccessMessage(payload.semester, matched))
        void navigate({
          search: (prev) => ({
            ...prev,
            type: "enrolled",
            semester:
              matched > 0 && payload.semester
                ? payload.semester
                : prev.semester,
            page: 1,
          }),
          replace: true,
          resetScroll: false,
        })
        return
      }
      toast.error(getSyncErrorMessage(payload.message))
    }

    const channel = new BroadcastChannel(COURSE_ENROLLMENT_SYNC_CHANNEL)
    channel.onmessage = (event: MessageEvent<CourseEnrollmentSyncMessage>) => {
      handleMessage(event.data)
    }
    const onWindowMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== COURSE_ENROLLMENT_SYNC_CHANNEL) return
      handleMessage(event.data.payload as CourseEnrollmentSyncMessage)
    }
    window.addEventListener("message", onWindowMessage)
    return () => {
      channel.close()
      window.removeEventListener("message", onWindowMessage)
    }
  }, [enrolledCourses, navigate])

  function handleViewChange(nextView: string) {
    const nextType: View =
      nextView === "followed" || nextView === "ignored" ? nextView : "enrolled"
    void navigate({
      search: (prev) => ({
        ...prev,
        type: nextType,
        page: 1,
      }),
      resetScroll: false,
    })
  }

  function handlePageChange(nextPage: number) {
    void navigate({
      search: (prev) => ({ ...prev, page: nextPage }),
      resetScroll: false,
    })
  }

  function handleSemesterChange(value: string) {
    void navigate({
      search: (prev) => ({
        ...prev,
        semester: value === ALL ? undefined : value,
        type: "enrolled",
        page: 1,
      }),
      resetScroll: false,
    })
  }

  function handleOpenSyncDialog() {
    setSyncSemester(defaultSyncSemester)
    setSyncOpen(true)
  }

  function handleStartSync() {
    if (!syncSemester) return
    const width = 560
    const height = 560
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2)
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2)
    const popup = window.open(
      courseEnrollmentSyncStartURL(syncSemester),
      "jaccount-course-sync",
      `popup=yes,width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,status=no,resizable=yes,scrollbars=yes`
    )
    if (!popup) {
      toast.error("浏览器拦截了 jAccount 授权窗口，请允许弹出窗口后重试")
      return
    }
    popup.focus()
    setSyncOpen(false)
  }

  function renderNotificationDeleteAction(
    course: NonNullable<typeof activeCourseQuery.data>["items"][number]
  ) {
    const actionName = view === "followed" ? "取消关注" : "取消屏蔽"

    return (
      <CourseNotificationDeleteAction
        course={course}
        actionName={actionName}
        onDelete={() =>
          notificationMutation.mutate(
            { courseID: course.id, level: 0 },
            {
              onSuccess: () =>
                toast.success(`已${actionName}「${course.name}」`),
              onError: (err) =>
                toast.error(
                  toUserMessage(err, `${actionName}失败，请稍后再试`)
                ),
            }
          )
        }
      />
    )
  }

  return (
    <>
      <PageTitle>我的课程</PageTitle>
      <PageShell>
        <div className="space-y-6">
          <PageHeader
            title="我的课程"
            description="查看选课记录和关注的课程"
            actions={
              <Button asChild size="sm" variant="outline">
                <Link to="/review/followed">
                  <RiMessage3Line data-icon="inline-start" />
                  关注动态
                </Link>
              </Button>
            }
          />

          <Tabs value={view} onValueChange={handleViewChange}>
            <TabsList>
              <TabsTrigger value="enrolled">选课记录</TabsTrigger>
              <TabsTrigger value="followed">已关注</TabsTrigger>
              <TabsTrigger value="ignored">已屏蔽</TabsTrigger>
            </TabsList>
          </Tabs>

          {view === "enrolled" && user && (
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={activeSemester ?? ALL}
                onValueChange={handleSemesterChange}
              >
                <SelectTrigger size="sm" className="w-44">
                  <SelectValue placeholder="按学期筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>全部学期</SelectItem>
                  {enrollmentSemesters.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <CourseEnrollmentSyncDialog
            open={syncOpen}
            onOpenChange={setSyncOpen}
            semester={syncSemester}
            semesters={syncSemesters}
            onSemesterChange={setSyncSemester}
            onStartSync={handleStartSync}
          />

          {!authLoading && !user && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">登录后可查看我的课程</p>
              <Button asChild variant="link" className="mt-2">
                <Link to="/login">登录</Link>
              </Button>
            </div>
          )}

          {user && view === "enrolled" && enrolledCourses.data && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                共 {filteredEnrollments.length} 条选课记录
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleOpenSyncDialog}
                disabled={syncSemesters.length === 0}
              >
                <RiRefreshLine data-icon="inline-start" />
                同步课表
              </Button>
            </div>
          )}

          {user && view !== "enrolled" && activeCourseQuery.data && (
            <p className="text-sm text-muted-foreground">
              共 {activeCourseQuery.data.total} 门{title}
            </p>
          )}

          {user && view === "enrolled" && (
            <CourseEnrollmentList
              enrollments={filteredEnrollments}
              isLoading={authLoading || enrolledCourses.isLoading}
              error={enrolledCourses.data ? undefined : enrolledCourses.error}
              onRetry={() => void enrolledCourses.refetch()}
              emptyAction={
                activeSemester ? undefined : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleOpenSyncDialog}
                    disabled={syncSemesters.length === 0}
                  >
                    <RiRefreshLine data-icon="inline-start" />
                    同步课表
                  </Button>
                )
              }
            />
          )}

          {user && view !== "enrolled" && (
            <CourseList
              courses={
                view === "followed"
                  ? (followedCourses.data?.items ?? [])
                  : (ignoredCourses.data?.items ?? [])
              }
              isLoading={
                authLoading ||
                (view === "followed"
                  ? followedCourses.isLoading
                  : ignoredCourses.isLoading)
              }
              error={
                activeCourseQuery.data ? undefined : activeCourseQuery.error
              }
              onRetry={() => void activeCourseQuery.refetch()}
              emptyTitle={
                view === "followed" ? "暂无关注的课程" : "暂无屏蔽的课程"
              }
              emptyDescription={
                view === "followed"
                  ? "在课程页将关注状态设为「关注」后，课程会显示在这里"
                  : "被屏蔽课程的点评不会出现在点评列表中"
              }
              renderAction={renderNotificationDeleteAction}
            />
          )}

          {user &&
            view !== "enrolled" &&
            activeCourseQuery.data &&
            activeCourseQuery.data.total > 0 && (
              <div className="flex justify-center pt-4">
                <PaginationComponent
                  page={activeCourseQuery.data.page}
                  pageSize={activeCourseQuery.data.page_size}
                  total={activeCourseQuery.data.total}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
        </div>
      </PageShell>
    </>
  )
}
