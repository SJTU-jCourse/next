export const COURSE_ENROLLMENT_SYNC_CHANNEL = "course-enrollment-sync"

export type CourseEnrollmentSyncMessage = {
  status: "ok" | "error"
  semester: string
  message?: string
  matched?: number
  total?: number
}

// 回调地址中的 message 可被任意构造，只展示后端已知的提示文案
const KNOWN_SYNC_ERROR_MESSAGES = new Set([
  "会话已失效，请重新同步",
  "登录状态校验失败，请重新同步",
  "你取消了 jAccount 授权，如需同步请重新授权",
  "jAccount 授权失败，请重新同步",
  "同步课表失败，请稍后再试",
  "选课同步功能已关闭",
  "jAccount 选课同步功能已关闭",
])

export function getSyncErrorMessage(message?: string) {
  if (message && KNOWN_SYNC_ERROR_MESSAGES.has(message)) return message
  return "同步课表失败，请关闭窗口后重试"
}

export function getSyncSuccessMessage(semester: string, matched: number) {
  return `已同步 ${semester || "所选学期"} 的课表，匹配到 ${matched} 门课程`
}
