import {
  getRouteApi,
  Link,
  useNavigate,
  useRouter,
} from "@tanstack/react-router"
import { RiArrowLeftLine } from "@remixicon/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/layout/page-shell"
import { PageTitle } from "@/components/common/page-title"
import { CourseHeaderMeta } from "@/components/course/course-header-meta"
import { ReviewForm } from "@/components/review/review-form"
import { WrongCourseWarning } from "@/components/review/wrong-course-warning"
import { useCourseDetail } from "@/hooks/use-course"
import { useCreateReview } from "@/hooks/use-review"
import {
  getCurrentSemesterSetting,
  useSystemSettings,
} from "@/hooks/use-system-settings"
import { useAuth } from "@/contexts/auth-context"
import {
  filterSemestersUpTo,
  getCourseSemesters,
  getDefaultSemester,
} from "@/lib/course-semesters"
import type { CreateReviewCommand, UpdateReviewCommand } from "@/api/review"

const routeApi = getRouteApi("/app/course/$courseID/review/new")

export function NewReviewPage() {
  const { courseID } = routeApi.useParams()
  const id = Number(courseID)
  const navigate = useNavigate()
  const router = useRouter()
  const { user } = useAuth()
  const { data: course } = useCourseDetail(id)
  const systemSettingsQuery = useSystemSettings(!!user)
  const { mutateAsync, isPending } = useCreateReview()
  const currentSemester = getCurrentSemesterSetting(systemSettingsQuery.data)
  const semesters = systemSettingsQuery.isLoading
    ? []
    : filterSemestersUpTo(getCourseSemesters(course), currentSemester)
  const defaultSemester = getDefaultSemester(semesters, currentSemester)

  async function handleSubmit(cmd: CreateReviewCommand | UpdateReviewCommand) {
    await mutateAsync(cmd as CreateReviewCommand)
    toast.success("点评已发布，感谢你的分享")
    await navigate({
      to: "/course/$courseID",
      params: { courseID: String(id) },
    })
  }

  return (
    <>
      <PageTitle>写点评</PageTitle>
      <PageShell>
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link to="/course/$courseID" params={{ courseID: String(id) }}>
            <RiArrowLeftLine data-icon="inline-start" />
            返回课程
          </Link>
        </Button>

        <section className="space-y-4">
          <div className="space-y-4">
            <h1 className="text-sm font-medium text-muted-foreground">
              写点评
            </h1>
            {course && <CourseHeaderMeta course={course} headingAs="h2" />}
          </div>

          <WrongCourseWarning
            course={course}
            currentSemester={currentSemester}
          />

          <ReviewForm
            courseID={id}
            semesters={semesters}
            defaultSemester={defaultSemester}
            onSubmit={handleSubmit}
            onCancel={() => router.history.back()}
            isSubmitting={isPending}
            draftUserID={user?.id}
          />
        </section>
      </PageShell>
    </>
  )
}
