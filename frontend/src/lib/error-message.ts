import { HttpError } from "@/api/client"

const STATUS_MESSAGES: Record<number, string> = {
  401: "登录已过期，请重新登录",
  403: "没有权限进行此操作",
  404: "内容不存在或已被删除",
  429: "操作太频繁，请稍后再试",
}

const SERVER_ERROR_MESSAGE = "服务暂时不可用，请稍后再试"
const NETWORK_ERROR_MESSAGE = "网络连接失败，请检查网络后重试"

const HAS_CJK = /[一-鿿]/

/**
 * 将请求错误转换为面向用户的中文提示。
 * 后端返回的中文业务提示原样展示；英文或技术性信息按状态码兜底。
 */
export function toUserMessage(err: unknown, fallback = "操作失败，请稍后再试") {
  if (err instanceof HttpError) {
    const message = err.body?.error
    if (message && HAS_CJK.test(message) && err.status < 500) return message
    if (err.status >= 500) return SERVER_ERROR_MESSAGE
    return STATUS_MESSAGES[err.status] ?? fallback
  }
  if (err instanceof TypeError) return NETWORK_ERROR_MESSAGE
  if (err instanceof Error && HAS_CJK.test(err.message)) return err.message
  return fallback
}

export function isNotFoundError(err: unknown) {
  return err instanceof HttpError && err.status === 404
}
