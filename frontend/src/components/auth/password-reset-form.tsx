import { useState, type SyntheticEvent } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { EmailPrefixInput } from "@/components/auth/email-prefix-input"
import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CodeInputWithButton } from "./code-button"
import { buildAuthEmail, validateAuthPassword } from "@/config/auth"
import { useAuth } from "@/contexts/auth-context"
import { useAuthEmailDomain } from "@/hooks/use-system-settings"
import { fieldError } from "./form-utils"

type PasswordResetFormValues = {
  emailPrefix: string
  code: string
  password: string
  confirmPassword: string
}

export function PasswordResetForm() {
  const navigate = useNavigate()
  const { resetPassword, sendResetCode } = useAuth()
  const emailDomain = useAuthEmailDomain()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      emailPrefix: "",
      code: "",
      password: "",
      confirmPassword: "",
    } as PasswordResetFormValues,
    onSubmit: async ({ value }) => {
      await resetPassword({
        email: buildAuthEmail(value.emailPrefix, emailDomain),
        code: value.code.trim(),
        new_password: value.password,
      })
      await navigate({ to: "/login" })
    },
  })

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    setSubmitError(null)
    void form.handleSubmit().catch((err: unknown) => {
      setSubmitError(err instanceof Error ? err.message : "重置失败")
    })
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>重置密码</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <form.Field
            name="emailPrefix"
            validators={{
              onSubmit: ({ value }) =>
                value.trim() ? undefined : "请填写邮箱",
            }}
          >
            {(field) => {
              const error = fieldError(field.state.meta.errors)
              return (
                <div className="space-y-2">
                  <EmailPrefixInput
                    id="email"
                    label="邮箱"
                    value={field.state.value}
                    emailDomain={emailDomain}
                    onChange={(value) => field.handleChange(value)}
                    onBlur={field.handleBlur}
                  />
                  {error && (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  )}
                </div>
              )
            }}
          </form.Field>
          <form.Field
            name="code"
            validators={{
              onSubmit: ({ value }) => (value ? undefined : "请填写验证码"),
            }}
          >
            {(field) => {
              const error = fieldError(field.state.meta.errors)
              return (
                <div className="space-y-2">
                  <form.Subscribe
                    selector={(state) => state.values.emailPrefix}
                  >
                    {(emailPrefix) => (
                      <CodeInputWithButton
                        id="code"
                        label="验证码"
                        email={
                          emailPrefix.trim()
                            ? buildAuthEmail(emailPrefix, emailDomain)
                            : ""
                        }
                        code={field.state.value}
                        onCodeChange={(value) =>
                          field.handleChange(value.trim())
                        }
                        onBlur={field.handleBlur}
                        onSend={sendResetCode}
                      />
                    )}
                  </form.Subscribe>
                  {error && (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  )}
                </div>
              )
            }}
          </form.Field>
          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => validateAuthPassword(value) ?? undefined,
              onSubmit: ({ value }) => validateAuthPassword(value) ?? undefined,
            }}
          >
            {(field) => {
              const error = fieldError(field.state.meta.errors)
              return (
                <div className="space-y-2">
                  <Label htmlFor="password">新密码</Label>
                  <PasswordInput
                    id="password"
                    placeholder="至少 10 位，含字母/数字/符号"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    autoComplete="new-password"
                  />
                  {error && (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  )}
                </div>
              )
            }}
          </form.Field>
          <form.Field
            name="confirmPassword"
            validators={{
              onChangeListenTo: ["password"],
              onChange: ({ value, fieldApi }) => {
                if (/\s/.test(value)) return "确认密码不能包含空白字符"
                if (!value) return undefined
                return value === fieldApi.form.getFieldValue("password")
                  ? undefined
                  : "两次输入的密码不一致"
              },
              onSubmit: ({ value, fieldApi }) => {
                if (/\s/.test(value)) return "确认密码不能包含空白字符"
                if (!value) return "请确认密码"
                return value === fieldApi.form.getFieldValue("password")
                  ? undefined
                  : "两次输入的密码不一致"
              },
            }}
          >
            {(field) => {
              const error = fieldError(field.state.meta.errors)
              return (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">确认密码</Label>
                  <PasswordInput
                    id="confirm-password"
                    placeholder="再次输入密码"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    autoComplete="new-password"
                  />
                  {error && (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  )}
                </div>
              )
            }}
          </form.Field>
          {submitError && (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          )}
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "重置中..." : "重置密码"}
                </Button>
              </>
            )}
          </form.Subscribe>
          <p className="text-center text-sm text-muted-foreground">
            已想起密码？
            <Link to="/login" className="ml-1 text-foreground hover:underline">
              返回登录
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
