import { useState, type SyntheticEvent } from "react"
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { EmailPrefixInput } from "@/components/auth/email-prefix-input"
import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buildAuthEmail } from "@/config/auth"
import { useAuth } from "@/contexts/auth-context"
import { useAuthEmailDomain } from "@/hooks/use-system-settings"
import { fieldError } from "./form-utils"

type LoginFormValues = {
  emailPrefix: string
  password: string
}

const routeApi = getRouteApi("/public/login")

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const search = routeApi.useSearch()
  const emailDomain = useAuthEmailDomain()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      emailPrefix: "",
      password: "",
    } as LoginFormValues,
    onSubmit: async ({ value }) => {
      await login({
        email: buildAuthEmail(value.emailPrefix, emailDomain),
        password: value.password,
      })
      await navigate({ href: search.redirect ?? "/", replace: true })
    },
  })

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    setSubmitError(null)
    void form.handleSubmit().catch((err: unknown) => {
      setSubmitError(err instanceof Error ? err.message : "登录失败")
    })
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>登录</CardTitle>
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
                    onChange={(value) => field.handleChange(value)}
                    onBlur={field.handleBlur}
                    placeholder="jAccount"
                    emailDomain={emailDomain}
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
            name="password"
            validators={{
              onChange: ({ value }) =>
                /\s/.test(value) ? "密码不能包含空白字符" : undefined,
              onSubmit: ({ value }) => {
                if (/\s/.test(value)) return "密码不能包含空白字符"
                return value ? undefined : "请填写密码"
              },
            }}
          >
            {(field) => {
              const error = fieldError(field.state.meta.errors)
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">密码</Label>
                    <Link
                      to="/password-reset"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      忘记或未设密码？
                    </Link>
                  </div>
                  <PasswordInput
                    id="password"
                    placeholder="选课社区密码，非 jAccount 密码"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    autoComplete="current-password"
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
                  {isSubmitting ? "登录中..." : "登录"}
                </Button>
              </>
            )}
          </form.Subscribe>
          <p className="text-center text-sm text-muted-foreground">
            还没有账号？
            <Link
              to="/register"
              className="ml-1 text-foreground hover:underline"
            >
              注册
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
