import type { PaginatedResult } from "./types"
import { apiClient } from "./client"
import { BASE_URL } from "./constants"
import { buildQuery } from "./query"

export type RecordReason = string

export interface PointRecordDTO {
  reason: RecordReason
  amount: number
  description: string
  created_at: string
}

export interface PointSummaryDTO {
  total: number
  records: PaginatedResult<PointRecordDTO>
}

export interface PointRecordListFilter {
  page?: number
  page_size?: number
  [key: string]: unknown
}

export function getUserPoints(
  userID: number,
  filter: PointRecordListFilter = {}
): Promise<PointSummaryDTO> {
  return apiClient(`${BASE_URL}/user/${userID}/point${buildQuery(filter)}`)
}
