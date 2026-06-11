import type { PaginatedResult } from "./types"
import type { CourseListItemDTO } from "./course"
import { apiClient } from "./client"
import { BASE_URL } from "./constants"
import { buildQuery } from "./query"

export const VoteLike = 1
export const VoteDislike = -1
export const VoteNeutral = 0

export type VoteType = typeof VoteLike | typeof VoteDislike | typeof VoteNeutral

export interface VoteStats {
  like_count: number
  dislike_count: number
  my_vote?: number
}

export interface ReviewDTO {
  id: number
  course?: CourseListItemDTO
  course_id: number
  user_id?: number
  semester?: string
  score: string
  rating: number
  content: string
  moderator_remark: string
  vote: VoteStats
  created_at: string
  updated_at: string
}

export interface ReviewRevisionDTO {
  id: number
  review_id: number
  course_id: number
  created_by: number
  semester: string
  score: string
  rating: number
  content: string
  created_at: string
}

export interface ReviewListFilter {
  q?: string
  semester?: string
  rating?: number
  order?: "like_count" | "created_at" | "updated_at"
  order_by?: "like_count" | "created_at" | "updated_at"
  ascend?: boolean
  page?: number
  page_size?: number
  [key: string]: unknown
}

export interface CreateReviewCommand {
  course_id: number
  semester?: string
  rating: number
  content: string
  score?: string
}

export interface UpdateReviewCommand {
  semester?: string
  rating: number
  content: string
  score?: string
}

export interface UpdateReviewModeratorRemarkCommand {
  moderator_remark: string
}

const reviewQueryOptions = { booleanAsNumber: true, trimKeys: ["q"] }

export function listReviews(
  filter: ReviewListFilter = {}
): Promise<PaginatedResult<ReviewDTO>> {
  return apiClient(
    `${BASE_URL}/review${buildQuery(filter, reviewQueryOptions)}`
  )
}

export function listFollowedReviews(
  filter: ReviewListFilter = {}
): Promise<PaginatedResult<ReviewDTO>> {
  return apiClient(
    `${BASE_URL}/review/followed${buildQuery(filter, reviewQueryOptions)}`
  )
}

export function getReview(reviewID: number): Promise<ReviewDTO> {
  return apiClient(`${BASE_URL}/review/${reviewID}`)
}

export function listReviewRevisions(
  reviewID: number
): Promise<ReviewRevisionDTO[]> {
  return apiClient(`${BASE_URL}/review/${reviewID}/revision`)
}

export function createReview(
  cmd: CreateReviewCommand
): Promise<{ message: string }> {
  return apiClient(`${BASE_URL}/review/`, {
    method: "POST",
    body: JSON.stringify(cmd),
  })
}

export function updateReview(
  reviewID: number,
  cmd: UpdateReviewCommand
): Promise<{ message: string }> {
  return apiClient(`${BASE_URL}/review/${reviewID}`, {
    method: "PUT",
    body: JSON.stringify(cmd),
  })
}

export function updateReviewModeratorRemark(
  reviewID: number,
  cmd: UpdateReviewModeratorRemarkCommand
): Promise<{ message: string }> {
  return apiClient(`${BASE_URL}/review/${reviewID}/moderator-remark`, {
    method: "PUT",
    body: JSON.stringify(cmd),
  })
}

export function deleteReview(reviewID: number): Promise<{ message: string }> {
  return apiClient(`${BASE_URL}/review/${reviewID}`, {
    method: "DELETE",
  })
}

export function voteReview(
  reviewID: number,
  voteType: VoteType
): Promise<{ message: string }> {
  return apiClient(`${BASE_URL}/review/${reviewID}/vote`, {
    method: "POST",
    body: JSON.stringify({ vote_type: voteType }),
  })
}

export function listUserReviews(
  userID: number,
  filter: ReviewListFilter = {}
): Promise<PaginatedResult<ReviewDTO>> {
  return apiClient(
    `${BASE_URL}/user/${userID}/review${buildQuery(filter, reviewQueryOptions)}`
  )
}
