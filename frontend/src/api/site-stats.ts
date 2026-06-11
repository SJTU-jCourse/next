import { apiClient } from "./client"
import { BASE_URL } from "./constants"
import { buildQuery } from "./query"

export interface SiteDailyStatDTO {
  stat_date: string
  active_user_count: number
  new_user_count: number
  new_review_count: number
  new_point_amount: number
  review_author_count: number
  new_like_count: number
  new_dislike_count: number
  total_user_count: number
  total_review_count: number
  reviewed_course_total: number
  generated_at: string
  updated_at: string
}

export interface SiteDailyStatListFilter {
  start_date?: string
  end_date?: string
  [key: string]: unknown
}

export function getDailyStat(date: string): Promise<SiteDailyStatDTO> {
  return apiClient(`${BASE_URL}/site-stat/daily/${date}`)
}

export function listDailyStats(
  filter: SiteDailyStatListFilter = {}
): Promise<SiteDailyStatDTO[]> {
  return apiClient(`${BASE_URL}/site-stat/daily${buildQuery(filter)}`)
}
