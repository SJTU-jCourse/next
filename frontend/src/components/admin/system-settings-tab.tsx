import { useMemo, useState } from "react"
import { toast } from "sonner"
import type { SystemSettingDTO } from "@/api/system-settings"
import { useCourseFilters } from "@/hooks/use-course"
import {
  useAdminSystemSettings,
  useUpdateSystemSetting,
} from "@/hooks/use-system-settings"
import { getErrorMessage } from "./admin-utils"
import { SystemSettingRow } from "./system-settings/system-setting-row"
import { SectionHeader } from "@/components/common/page-header"

type DraftMap = Record<string, string>
type ErrorMap = Record<string, string>

const GROUP_LABELS: Record<string, string> = {
  admin: "管理",
  api_key: "API key",
  auth: "认证",
  course: "课程",
  review: "点评",
  review_reward: "点评积分",
}

export function SystemSettingsTab() {
  const settingsQuery = useAdminSystemSettings()
  const filtersQuery = useCourseFilters()
  const updateMutation = useUpdateSystemSetting()
  const [drafts, setDrafts] = useState<DraftMap>({})
  const [errors, setErrors] = useState<ErrorMap>({})

  const semesters = useMemo(
    () => filtersQuery.data?.semesters?.filter((item) => item.name) ?? [],
    [filtersQuery.data?.semesters]
  )

  const groups = useMemo(() => {
    const items = settingsQuery.data ?? []
    return items.reduce<Record<string, SystemSettingDTO[]>>((acc, item) => {
      const group = item.group || "other"
      acc[group] = [...(acc[group] ?? []), item]
      return acc
    }, {})
  }, [settingsQuery.data])

  function draftValue(setting: SystemSettingDTO) {
    return drafts[setting.key] ?? setting.value
  }

  function setDraft(key: string, value: string) {
    setDrafts((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function restoreDefault(setting: SystemSettingDTO) {
    setDraft(setting.key, setting.default_value)
  }

  async function saveSetting(setting: SystemSettingDTO) {
    setErrors((current) => {
      const next = { ...current }
      delete next[setting.key]
      return next
    })
    try {
      await updateMutation.mutateAsync({
        key: setting.key,
        cmd: { value: draftValue(setting) },
      })
      setDrafts((current) => {
        const next = { ...current }
        delete next[setting.key]
        return next
      })
      toast.success("已保存设置")
    } catch (err) {
      setErrors((current) => ({
        ...current,
        [setting.key]: getErrorMessage(err),
      }))
    }
  }

  const isLoading = settingsQuery.isLoading || filtersQuery.isLoading

  return (
    <section className="space-y-4">
      <SectionHeader title="系统设置" />

      <div className="space-y-6">
        {Object.entries(groups).map(([group, settings]) => (
          <section key={group} className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              {GROUP_LABELS[group] ?? group}
            </h3>
            <div className="divide-y rounded-md border">
              {settings.map((setting) => {
                const value = draftValue(setting)
                const isDirty = value !== setting.value
                const submitting =
                  updateMutation.isPending &&
                  updateMutation.variables?.key === setting.key
                const settingError = errors[setting.key]

                return (
                  <SystemSettingRow
                    key={setting.key}
                    setting={setting}
                    value={value}
                    semesters={semesters.map((item) => item.name)}
                    isDirty={isDirty}
                    isLoading={isLoading}
                    submitting={submitting}
                    error={settingError}
                    onChange={(next) => setDraft(setting.key, next)}
                    onSave={() => void saveSetting(setting)}
                    onRestoreDefault={() => restoreDefault(setting)}
                  />
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
