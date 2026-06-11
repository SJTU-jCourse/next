import { useState, type SyntheticEvent } from "react"
import { useForm } from "@tanstack/react-form"
import dayjs from "dayjs"
import { zhCN } from "date-fns/locale"
import {
  RiAddLine,
  RiCalendarLine,
  RiDeleteBinLine,
  RiEditLine,
  RiExternalLinkLine,
} from "@remixicon/react"
import type {
  AnnouncementDTO,
  SaveAnnouncementCommand,
} from "@/api/announcement"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  useAdminAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useUpdateAnnouncement,
} from "@/hooks/use-announcement"
import { formatDateTime } from "@/lib/date"
import { getErrorMessage } from "./admin-utils"

type AnnouncementFormState = {
  title: string
  body: string
  priority: string
  show_start: string
  show_end: string
  link_url: string
  link_title: string
}

const emptyForm: AnnouncementFormState = {
  title: "",
  body: "",
  priority: "0",
  show_start: "",
  show_end: "",
  link_url: "",
  link_title: "",
}

const hourOptions = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
)
const minuteOptions = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0")
)

function toDateTimeLocal(value: string) {
  const date = dayjs(value)
  return date.isValid() ? date.format("YYYY-MM-DDTHH:mm") : ""
}

function toFormState(
  announcement: AnnouncementDTO | null
): AnnouncementFormState {
  if (!announcement) return emptyForm
  return {
    title: announcement.title,
    body: announcement.body,
    priority: String(announcement.priority),
    show_start: toDateTimeLocal(announcement.show_start),
    show_end: toDateTimeLocal(announcement.show_end),
    link_url: announcement.link_url ?? "",
    link_title: announcement.link_title ?? "",
  }
}

function buildCommand(form: AnnouncementFormState): SaveAnnouncementCommand {
  const priority = Number(form.priority)
  return {
    title: form.title.trim(),
    body: form.body.trim(),
    priority: Number.isFinite(priority) ? Math.trunc(priority) : 0,
    show_start: new Date(form.show_start).toISOString(),
    show_end: new Date(form.show_end).toISOString(),
    link_url: form.link_url.trim(),
    link_title: form.link_title.trim(),
  }
}

function validateForm(form: AnnouncementFormState) {
  if (!form.title.trim() && !form.body.trim()) return "标题和内容至少填写一项"
  if (!form.show_start) return "请选择开始时间"
  if (!form.show_end) return "请选择结束时间"
  const start = new Date(form.show_start)
  const end = new Date(form.show_end)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "展示时间无效"
  }
  if (end <= start) return "结束时间必须晚于开始时间"
  const linkURL = form.link_url.trim()
  if (linkURL) {
    try {
      const parsed = new URL(linkURL)
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return "外链只支持 http 或 https"
      }
    } catch {
      return "外链地址无效"
    }
  }
  return ""
}

export function AnnouncementsTab() {
  const announcementsQuery = useAdminAnnouncements()
  const createMutation = useCreateAnnouncement()
  const updateMutation = useUpdateAnnouncement()
  const deleteMutation = useDeleteAnnouncement()
  const [editing, setEditing] = useState<AnnouncementDTO | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(announcement: AnnouncementDTO) {
    setEditing(announcement)
    setDialogOpen(true)
  }

  async function saveAnnouncement(cmd: SaveAnnouncementCommand) {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, cmd })
    } else {
      await createMutation.mutateAsync(cmd)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-lg font-medium">公告</h2>
        <Button onClick={openCreate}>
          <RiAddLine data-icon="inline-start" />
          新建公告
        </Button>
      </div>

      {dialogOpen ? (
        <AnnouncementDialog
          open={dialogOpen}
          announcement={editing}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onOpenChange={setDialogOpen}
          onSave={saveAnnouncement}
        />
      ) : null}

      <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>标题</TableHead>
              <TableHead>优先级</TableHead>
              <TableHead>展示时间</TableHead>
              <TableHead>外链</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcementsQuery.isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  加载中
                </TableCell>
              </TableRow>
            ) : (announcementsQuery.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  暂无公告
                </TableCell>
              </TableRow>
            ) : (
              (announcementsQuery.data ?? []).map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell className="font-mono">{announcement.id}</TableCell>
                  <TableCell className="max-w-56 whitespace-normal">
                    <div className="space-y-1">
                      <p className="font-medium">{announcement.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {announcement.body}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{announcement.priority}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      <p>{formatDateTime(announcement.show_start)}</p>
                      <p className="text-muted-foreground">
                        至 {formatDateTime(announcement.show_end)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-52">
                    {announcement.link_url ? (
                      <a
                        href={announcement.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex max-w-full items-center gap-1 text-primary underline-offset-4 hover:underline"
                      >
                        <span className="truncate">
                          {announcement.link_title || announcement.link_url}
                        </span>
                        <RiExternalLinkLine className="size-4 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDateTime(announcement.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            aria-label="编辑公告"
                            onClick={() => openEdit(announcement)}
                          >
                            <RiEditLine />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>编辑</TooltipContent>
                      </Tooltip>
                      <AlertDialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="destructive"
                                aria-label="删除公告"
                              >
                                <RiDeleteBinLine />
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>删除</TooltipContent>
                        </Tooltip>
                        <AlertDialogContent size="sm">
                          <AlertDialogHeader>
                            <AlertDialogTitle>删除公告</AlertDialogTitle>
                            <AlertDialogDescription>
                              删除后该公告不会再展示，此操作无法撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              disabled={deleteMutation.isPending}
                              onClick={() =>
                                deleteMutation.mutateAsync(announcement.id)
                              }
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TooltipProvider>
    </section>
  )
}

function AnnouncementDialog({
  open,
  announcement,
  isSaving,
  onOpenChange,
  onSave,
}: {
  open: boolean
  announcement: AnnouncementDTO | null
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (cmd: SaveAnnouncementCommand) => Promise<void>
}) {
  const [submitError, setSubmitError] = useState("")
  const form = useForm({
    defaultValues: toFormState(announcement),
    onSubmit: async ({ value }) => {
      const validationError = validateForm(value)
      if (validationError) throw new Error(validationError)

      await onSave(buildCommand(value))
      onOpenChange(false)
    },
  })

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    event.stopPropagation()
    setSubmitError("")
    void form.handleSubmit().catch((err: unknown) => {
      setSubmitError(getErrorMessage(err))
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{announcement ? "编辑公告" : "新建公告"}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="title">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="announcement-title">标题（可选）</Label>
                  <Input
                    id="announcement-title"
                    value={field.state.value}
                    maxLength={200}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="priority">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="announcement-priority">优先级（可选）</Label>
                  <Input
                    id="announcement-priority"
                    type="number"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="body">
              {(field) => (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="announcement-body">内容（可选）</Label>
                  <Textarea
                    id="announcement-body"
                    value={field.state.value}
                    className="min-h-28"
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="link_title">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="announcement-link-title">
                    外链标题（可选）
                  </Label>
                  <Input
                    id="announcement-link-title"
                    value={field.state.value}
                    maxLength={200}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="link_url">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="announcement-link-url">
                    外链地址（可选）
                  </Label>
                  <Input
                    id="announcement-link-url"
                    value={field.state.value}
                    placeholder="https://example.com"
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="show_start">
              {(field) => (
                <DateTimeControl
                  id="announcement-show-start"
                  label="开始时间"
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              )}
            </form.Field>
            <form.Field name="show_end">
              {(field) => (
                <DateTimeControl
                  id="announcement-show-end"
                  label="结束时间"
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              )}
            </form.Field>
          </div>

          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                取消
              </Button>
            </DialogClose>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(formSubmitting) => {
                const submitting = isSaving || formSubmitting
                return (
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "保存中" : "保存"}
                  </Button>
                )
              }}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DateTimeControl({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const current = dayjs(value)
  const selected = current.isValid() ? current.toDate() : undefined
  const hour = current.isValid() ? current.format("HH") : "00"
  const minute = current.isValid() ? current.format("mm") : "00"

  function nextValue(date: Date, nextHour = hour, nextMinute = minute) {
    return dayjs(date)
      .hour(Number(nextHour))
      .minute(Number(nextMinute))
      .second(0)
      .millisecond(0)
      .format("YYYY-MM-DDTHH:mm")
  }

  function setTime(nextHour: string, nextMinute: string) {
    onChange(nextValue(selected ?? new Date(), nextHour, nextMinute))
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className="h-9 w-full justify-between font-normal"
          >
            <span className={selected ? undefined : "text-muted-foreground"}>
              {selected ? formatDateTime(selected) : "选择时间"}
            </span>
            <RiCalendarLine className="size-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              if (!date) return
              onChange(nextValue(date))
            }}
            locale={zhCN}
            captionLayout="dropdown"
          />
          <div className="flex items-center gap-2 border-t p-3">
            <Select
              value={hour}
              onValueChange={(nextHour) => setTime(nextHour, minute)}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hourOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item} 时
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={minute}
              onValueChange={(nextMinute) => setTime(hour, nextMinute)}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {minuteOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item} 分
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              完成
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
