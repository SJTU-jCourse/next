import { toUserMessage } from "@/lib/error-message"

export type FormSubmitEvent = {
  preventDefault(): void
  currentTarget: HTMLFormElement
}

export function getErrorMessage(error: unknown) {
  return toUserMessage(error, "请求失败，请稍后再试")
}
