import type {
  PaginatedResult,
  FilterItem,
  RatingInfoDTO,
  TeacherDTO,
} from "./types"
export type { RatingInfoDTO } from "./types"
import type { ReviewDTO, ReviewListFilter } from "./review"
import { apiClient } from "./client"
import { BASE_URL } from "./constants"
import { buildQuery } from "./query"

export interface CourseFilters {
  credits?: FilterItem[]
  departments?: FilterItem[]
  categories?: FilterItem[]
  target_years?: FilterItem[]
  languages?: FilterItem[]
  semesters?: FilterItem[]
}

export interface CourseReviewFilters {
  semesters?: FilterItem[]
  ratings?: FilterItem[]
}

export interface CourseReviewTrendItemDTO {
  semester: string
  avg: number
  count: number
}

export type CourseNotificationLevel = 0 | 1 | 2

export interface CourseListItemDTO {
  id: number
  code: string
  name: string
  credit: number
  department: string
  language: string
  target_years?: string[]
  categories?: string[]
  main_teacher: TeacherDTO
  rating: RatingInfoDTO
}

export interface OfferedCourseDTO {
  semester: string
  language: string
  target_years?: string[]
  categories?: string[]
}

export interface CourseDetailDTO {
  id: number
  code: string
  name: string
  credit: number
  department: string
  last_semester: string
  moderator_remark: string
  language: string
  target_years?: string[]
  categories?: string[]
  main_teacher: TeacherDTO
  teacher_group?: TeacherDTO[]
  offered_courses: OfferedCourseDTO[]
  rating: RatingInfoDTO
  same_code_courses: CourseListItemDTO[]
  same_teacher_courses: CourseListItemDTO[]
  notification_level: CourseNotificationLevel
  my_enrollments?: CourseEnrollmentDTO[]
  my_review?: ReviewDTO
}

export interface UpdateCourseModeratorRemarkCommand {
  moderator_remark: string
}

export interface CourseEnrollmentDTO {
  id: number
  course: CourseListItemDTO
  semester: string
  created_at: string
}

export interface HotCourseItemDTO {
  course: CourseListItemDTO
  score: number
}

export interface HotCourseListDTO {
  period: "week" | "month"
  period_key: string
  items: HotCourseItemDTO[]
}

export interface CourseListFilter {
  q?: string
  department?: string
  language?: string
  categories?: string[]
  target_years?: string[]
  credit?: number
  has_review?: boolean
  order_by?: "rating_score" | "rating_count"
  ascend?: boolean
  page?: number
  page_size?: number
  [key: string]: unknown
}

const courseQueryOptions = { booleanAsNumber: true, trimKeys: ["q"] }

export function getCourseFilters(): Promise<CourseFilters> {
  return apiClient(`${BASE_URL}/course/filter`)
}

export function listCourses(
  filter: CourseListFilter = {}
): Promise<PaginatedResult<CourseListItemDTO>> {
  return apiClient(
    `${BASE_URL}/course/${buildQuery(filter, courseQueryOptions)}`
  )
}

export function getCourseDetail(courseID: number): Promise<CourseDetailDTO> {
  return apiClient(`${BASE_URL}/course/${courseID}`)
}

export function listCourseReviews(
  courseID: number,
  filter: ReviewListFilter = {}
): Promise<PaginatedResult<ReviewDTO>> {
  return apiClient(
    `${BASE_URL}/course/${courseID}/review${buildQuery(filter, courseQueryOptions)}`
  )
}

export function getCourseReviewFilters(
  courseID: number
): Promise<CourseReviewFilters> {
  return apiClient(`${BASE_URL}/course/${courseID}/review/filter`)
}

export function getCourseReviewTrend(
  courseID: number
): Promise<CourseReviewTrendItemDTO[]> {
  return apiClient(`${BASE_URL}/course/${courseID}/review/trend`)
}

export function setNotificationLevel(
  courseID: number,
  level: CourseNotificationLevel
): Promise<{ message: string }> {
  return apiClient(`${BASE_URL}/course/${courseID}/notification`, {
    method: "POST",
    body: JSON.stringify({ level }),
  })
}

export function updateCourseModeratorRemark(
  courseID: number,
  cmd: UpdateCourseModeratorRemarkCommand
): Promise<{ message: string }> {
  return apiClient(`${BASE_URL}/course/${courseID}/moderator-remark`, {
    method: "PUT",
    body: JSON.stringify(cmd),
  })
}

export function listFollowedCourses(
  filter: CourseListFilter = {}
): Promise<PaginatedResult<CourseListItemDTO>> {
  return apiClient(
    `${BASE_URL}/course/followed${buildQuery(filter, courseQueryOptions)}`
  )
}

export function listIgnoredCourses(
  filter: CourseListFilter = {}
): Promise<PaginatedResult<CourseListItemDTO>> {
  return apiClient(
    `${BASE_URL}/course/ignored${buildQuery(filter, courseQueryOptions)}`
  )
}

export function listCourseEnrollments(): Promise<CourseEnrollmentDTO[]> {
  return apiClient(`${BASE_URL}/course/enrolled`)
}

export function courseEnrollmentSyncStartURL(semester: string): string {
  const params = new URLSearchParams({ semester })
  return `${BASE_URL}/course/enrollment-sync/start?${params}`
}

export function deleteCourseEnrollment(
  enrollmentID: number
): Promise<{ message: string }> {
  return apiClient(`${BASE_URL}/course/enrollment/${enrollmentID}`, {
    method: "DELETE",
  })
}

export function listHotCourses(
  period: "week" | "month" = "week",
  limit?: number
): Promise<HotCourseListDTO> {
  const params = new URLSearchParams({ period })
  if (limit !== undefined) params.set("limit", String(limit))
  return apiClient(`${BASE_URL}/course/hot?${params}`)
}
