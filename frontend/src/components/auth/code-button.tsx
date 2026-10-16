import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toUserMessage } from "@/lib/error-message"

interface CodeButtonProps {
  email: string
  onSend: (email: string) => Promise<void>
  disabled?: boolean
}

const COUNTDOWN_SECONDS = 60

export function CodeButton({ email, onSend, disabled }: CodeButtonProps) {
  const [seconds, setSeconds] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (seconds <= 0) return
    const timer = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [seconds])

  async function handleClick() {
    setError(null)
    if (!email) {
      setError("请先填写邮箱")
      return
    }
    setIsSending(true)
    try {
      await onSend(email)
      setSeconds(COUNTDOWN_SECONDS)
      toast.success("验证码已发送，请查收邮件")
    } catch (err) {
      setError(toUserMessage(err, "发送失败，请稍后再试"))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleClick}
        disabled={disabled || isSending || seconds > 0}
      >
        {seconds > 0
          ? `${seconds} 秒后可重发`
          : isSending
            ? "发送中…"
            : "发送验证码"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

interface CodeInputProps {
  id: string
  label: string
  email: string
  code: string
  onCodeChange: (v: string) => void
  onBlur?: () => void
  onSend: (email: string) => Promise<void>
  disabled?: boolean
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

export function CodeInputWithButton({
  id,
  label,
  email,
  code,
  onCodeChange,
  onBlur,
  onSend,
  disabled,
  ...ariaProps
}: CodeInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="grid grid-cols-[1fr_auto] items-start gap-2">
        <Input
          id={id}
          placeholder="6 位验证码"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          onBlur={onBlur}
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          {...ariaProps}
        />
        <CodeButton email={email} onSend={onSend} disabled={disabled} />
      </div>
    </div>
  )
}
