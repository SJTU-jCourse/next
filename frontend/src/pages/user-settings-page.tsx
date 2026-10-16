import { PageTitle } from "@/components/common/page-title"
import { PageShell } from "@/components/layout/page-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTheme } from "@/components/theme-provider"

const themeOptions = [
  { value: "system", label: "跟随系统" },
  { value: "light", label: "亮色" },
  { value: "dark", label: "暗色" },
] as const

function ThemeSettings() {
  const { theme, setTheme } = useTheme()

  function handleThemeChange(value: string) {
    if (value === "system" || value === "light" || value === "dark") {
      setTheme(value)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="theme-mode">外观模式</Label>
      <Select value={theme} onValueChange={handleThemeChange}>
        <SelectTrigger id="theme-mode" className="w-full">
          <SelectValue placeholder="选择外观模式" />
        </SelectTrigger>
        <SelectContent>
          {themeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm leading-6 text-muted-foreground">
        仅保存在当前浏览器，不会同步到其他设备。
      </p>
    </div>
  )
}

export function UserSettingsPage() {
  return (
    <>
      <PageTitle>用户设置</PageTitle>
      <PageShell>
        <div className="mx-auto max-w-2xl space-y-6">
          <h1 className="text-2xl font-bold">用户设置</h1>

          <Card>
            <CardHeader>
              <CardTitle>偏好设置</CardTitle>
            </CardHeader>
            <CardContent>
              <section>
                <ThemeSettings />
              </section>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </>
  )
}
