import type { PaginatedResult } from "./types"
import { apiClient } from "./client"
import { BASE_URL } from "./constants"
import { buildQuery } from "./query"

export interface AuditLogDTO {
  id: string
  occurred_at: string
  actor_user_id: number
  action: string
  target_type: string
  target_id: string
  details: Record<string, unknown>
  created_at: string
}

export interface AuditLogListFilter {
  start_time?: string
  end_time?: string
  action?: string
  actor_user_id?: number
  page?: number
  page_size?: number
  [key: string]: unknown
}

export function listAuditLogs(
  filter: AuditLogListFilter = {}
): Promise<PaginatedResult<AuditLogDTO>> {
  return apiClient(`${BASE_URL}/admin/audit-log${buildQuery(filter)}`)
}
