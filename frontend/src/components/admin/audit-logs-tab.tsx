import { useState } from "react"
import { getRouteApi, useNavigate } from "@tanstack/react-router"
import dayjs from "dayjs"
import { zhCN } from "date-fns/locale"
import { RiCalendarLine, RiSearchLine } from "@remixicon/react"
import { PaginationComponent } from "@/components/common/pagination"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuditLogs } from "@/hooks/use-audit-log"
import { formatDateInputValue, formatDateTime } from "@/lib/date"
import { getErrorMessage, type FormSubmitEvent } from "./admin-utils"

function formDataString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : ""
}

const pageSize = 20
const allActionsValue = "__all__"
const routeApi = getRouteApi("/app/admin/user")

const actionOptions = [
  { value: "user.suspend", label: "封禁用户" },
  { value: "user.unsuspend", label: "解封用户" },
  { value: "user.password_reset", label: "重置密码" },
  { value: "admin.grant", label: "授予管理员" },
  { value: "admin.revoke", label: "撤回管理员" },
  { value: "system_api_key.create", label: "新增系统 API Key" },
  { value: "system_api_key.delete", label: "删除系统 API Key" },
  { value: "system_settings.update", label: "修改系统设置" },
  { value: "review.update", label: "修改点评" },
  { value: "review.delete", label: "删除点评" },
  { value: "review.moderator_remark.update", label: "修改管理备注" },
]

const actionLabels = Object.fromEntries(
  actionOptions.map((item) => [item.value, item.label])
)

function detailText(details: Record<string, unknown>) {
  const parts = Object.entries(details)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
    .map(([key, value]) => `${key}: ${String(value)}`)
  return parts.length ? parts.join("; ") : "-"
}

function parseDateInputValue(value: string): Date | undefined {
  const date = dayjs(value)
  return date.isValid() ? date.toDate() : undefined
}

type DateFilterPickerProps = {
  id: string
  name: string
  label: string
  value: string
  onChange: (value: string) => void
}

function DateFilterPicker({
  id,
  name,
  label,
  value,
  onChange,
}: DateFilterPickerProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = parseDateInputValue(value)

  return (
    <div className="flex w-40 flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className="h-9 w-full justify-between font-normal"
          >
            <span className={value ? undefined : "text-muted-foreground"}>
              {value || "选择日期"}
            </span>
            <RiCalendarLine className="size-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={(date) => {
              if (!date) return
              onChange(formatDateInputValue(date))
              setOpen(false)
            }}
            locale={zhCN}
            captionLayout="dropdown"
          />
          {value ? (
            <div className="border-t p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  onChange("")
                  setOpen(false)
                }}
              >
                清除日期
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function AuditLogsTab() {
  const search = routeApi.useSearch()
  const navigate = useNavigate({ from: "/admin/user" })
  const page = Math.max(1, search.audit_page ?? 1)
  const startTime = search.audit_start_time ?? ""
  const endTime = search.audit_end_time ?? ""
  const action = search.audit_action ?? ""
  const actorUserID = Math.max(0, search.audit_actor_user_id ?? 0)

  const logsQuery = useAuditLogs({
    start_time: startTime || undefined,
    end_time: endTime || undefined,
    action: action || undefined,
    actor_user_id: actorUserID || undefined,
    page,
    page_size: pageSize,
  })

  function handleSearch(event: FormSubmitEvent) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nextStart = formDataString(formData.get("start_time"))
    const nextEnd = formDataString(formData.get("end_time"))
    const nextActor = formDataString(formData.get("actor_user_id")).trim()
    const nextActorID = Number(nextActor)
    const nextActorUserID =
      nextActor && Number.isFinite(nextActorID) && nextActorID > 0
        ? Math.trunc(nextActorID)
        : undefined
    void navigate({
      search: (prev) => ({
        ...prev,
        tab: "audit-log",
        audit_page: 1,
        audit_start_time: nextStart || undefined,
        audit_end_time: nextEnd || undefined,
        audit_actor_user_id: nextActorUserID,
      }),
      replace: true,
      resetScroll: false,
    })
  }

  function setAction(value: string) {
    void navigate({
      search: (prev) => ({
        ...prev,
        tab: "audit-log",
        audit_page: 1,
        audit_action: value === allActionsValue ? undefined : value,
      }),
      replace: true,
      resetScroll: false,
    })
  }

  function setDateFilter(key: "audit_start_time" | "audit_end_time") {
    return (value: string) => {
      void navigate({
        search: (prev) => ({
          ...prev,
          tab: "audit-log",
          audit_page: 1,
          [key]: value || undefined,
        }),
        replace: true,
        resetScroll: false,
      })
    }
  }

  function setPage(nextPage: number) {
    void navigate({
      search: (prev) => ({
        ...prev,
        tab: "audit-log",
        audit_page: nextPage,
      }),
      replace: true,
      resetScroll: false,
    })
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-lg font-medium">审计日志</h2>
      </div>

      <form className="flex flex-wrap items-end gap-2" onSubmit={handleSearch}>
        <DateFilterPicker
          id="audit-start-time"
          name="start_time"
          label="开始时间"
          value={startTime}
          onChange={setDateFilter("audit_start_time")}
        />
        <DateFilterPicker
          id="audit-end-time"
          name="end_time"
          label="结束时间"
          value={endTime}
          onChange={setDateFilter("audit_end_time")}
        />
        <div className="flex w-36 flex-col gap-1">
          <Label htmlFor="audit-actor-user-id">触发人 ID</Label>
          <Input
            id="audit-actor-user-id"
            name="actor_user_id"
            type="number"
            min={1}
            defaultValue={actorUserID || ""}
            className="w-full"
          />
        </div>
        <div className="flex w-52 flex-col gap-1">
          <Label htmlFor="audit-action">行为</Label>
          <Select value={action || allActionsValue} onValueChange={setAction}>
            <SelectTrigger
              id="audit-action"
              className="h-9 w-full items-center"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={allActionsValue}>全部行为</SelectItem>
              {actionOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="h-9">
          <RiSearchLine />
          查询
        </Button>
      </form>

      {logsQuery.data ? (
        <p className="text-sm text-muted-foreground">
          共 {logsQuery.data.total} 条
        </p>
      ) : null}

      {logsQuery.isLoading ? <Skeleton className="h-96 w-full" /> : null}

      {logsQuery.isError ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(logsQuery.error)}
        </p>
      ) : null}

      {logsQuery.data && !logsQuery.isLoading ? (
        <div className="border-y">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>行为</TableHead>
                <TableHead>触发人</TableHead>
                <TableHead>对象</TableHead>
                <TableHead>详情</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsQuery.data.items.length ? (
                logsQuery.data.items.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(log.occurred_at)}
                    </TableCell>
                    <TableCell>
                      {actionLabels[log.action] ?? log.action}
                    </TableCell>
                    <TableCell className="font-mono">
                      {log.actor_user_id}
                    </TableCell>
                    <TableCell className="font-mono">
                      {log.target_type}:{log.target_id}
                    </TableCell>
                    <TableCell className="max-w-md text-muted-foreground">
                      {detailText(log.details)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    暂无审计日志
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {logsQuery.data && logsQuery.data.total > pageSize ? (
        <PaginationComponent
          page={logsQuery.data.page}
          pageSize={logsQuery.data.page_size}
          total={logsQuery.data.total}
          onPageChange={setPage}
        />
      ) : null}
    </section>
  )
}
