import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import {
  listCourses,
  getCourseFilters,
  getCourseDetail,
  listCourseReviews,
  getCourseReviewFilters,
  getCourseReviewTrend,
  setNotificationLevel,
  listFollowedCourses,
  listIgnoredCourses,
  listHotCourses,
  listCourseEnrollments,
  deleteCourseEnrollment,
  updateCourseModeratorRemark,
  type CourseDetailDTO,
  type CourseListFilter,
  type CourseNotificationLevel,
  type UpdateCourseModeratorRemarkCommand,
} from "@/api/course"
import type { ReviewListFilter } from "@/api/review"

export function useCourseFilters() {
  return useQuery({
    queryKey: ["course-filters"],
    queryFn: getCourseFilters,
  })
}

export function useCourses(filter: CourseListFilter = {}) {
  return useQuery({
    queryKey: ["courses", filter],
    queryFn: () => listCourses(filter),
    placeholderData: keepPreviousData,
  })
}

export function useCourseDetail(courseID: number) {
  return useQuery({
    queryKey: ["course", courseID],
    queryFn: () => getCourseDetail(courseID),
    enabled: !!courseID,
  })
}

export function useCourseReviews(
  courseID: number,
  filter: ReviewListFilter = {}
) {
  return useQuery({
    queryKey: ["course-reviews", courseID, filter],
    queryFn: () => listCourseReviews(courseID, filter),
    enabled: !!courseID,
    placeholderData: keepPreviousData,
  })
}

export function useCourseReviewFilters(courseID: number) {
  return useQuery({
    queryKey: ["course-review-filters", courseID],
    queryFn: () => getCourseReviewFilters(courseID),
    enabled: !!courseID,
  })
}

export function useCourseReviewTrend(courseID: number, enabled = true) {
  return useQuery({
    queryKey: ["course-review-trend", courseID],
    queryFn: () => getCourseReviewTrend(courseID),
    enabled: enabled && !!courseID,
  })
}

export function useSetNotificationLevel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      courseID,
      level,
    }: {
      courseID: number
      level: CourseNotificationLevel
    }) => setNotificationLevel(courseID, level),
    onMutate: async ({ courseID, level }) => {
      await queryClient.cancelQueries({ queryKey: ["course", courseID] })
      const previous = queryClient.getQueryData<CourseDetailDTO>([
        "course",
        courseID,
      ])
      queryClient.setQueryData<CourseDetailDTO>(
        ["course", courseID],
        (course) => (course ? { ...course, notification_level: level } : course)
      )
      return { previous, courseID }
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["course", context.courseID], context.previous)
      }
    },
    onSuccess: (_, { courseID }) => {
      void queryClient.invalidateQueries({ queryKey: ["course", courseID] })
      void queryClient.invalidateQueries({ queryKey: ["followed-courses"] })
      void queryClient.invalidateQueries({ queryKey: ["ignored-courses"] })
    },
  })
}

export function useUpdateCourseModeratorRemark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      courseID,
      cmd,
    }: {
      courseID: number
      cmd: UpdateCourseModeratorRemarkCommand
    }) => updateCourseModeratorRemark(courseID, cmd),
    onSuccess: (_, { courseID }) => {
      void queryClient.invalidateQueries({ queryKey: ["course", courseID] })
    },
  })
}

export function useFollowedCourses(
  filter: CourseListFilter = {},
  enabled = true
) {
  return useQuery({
    queryKey: ["followed-courses", filter],
    queryFn: () => listFollowedCourses(filter),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useIgnoredCourses(
  filter: CourseListFilter = {},
  enabled = true
) {
  return useQuery({
    queryKey: ["ignored-courses", filter],
    queryFn: () => listIgnoredCourses(filter),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useCourseEnrollments(enabled = true) {
  return useQuery({
    queryKey: ["course-enrollments"],
    queryFn: listCourseEnrollments,
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useDeleteCourseEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (enrollmentID: number) => deleteCourseEnrollment(enrollmentID),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["course-enrollments"] })
    },
  })
}

export function useHotCourses(
  period: "week" | "month" = "week",
  limit?: number,
  enabled = true
) {
  return useQuery({
    queryKey: ["hot-courses", period, limit],
    queryFn: () => listHotCourses(period, limit),
    enabled,
  })
}
