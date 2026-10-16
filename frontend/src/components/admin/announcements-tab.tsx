import { useState } from "react"
import { toast } from "sonner"
import { getErrorMessage } from "./admin-utils"
import { RiAddLine } from "@remixicon/react"
import type {
  AnnouncementDTO,
  SaveAnnouncementCommand,
} from "@/api/announcement"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useAdminAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useUpdateAnnouncement,
} from "@/hooks/use-announcement"
import { AnnouncementDialog } from "./announcements/announcement-dialog"
import { AnnouncementRow } from "./announcements/announcement-row"

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
      toast.success("已保存公告")
    } else {
      await createMutation.mutateAsync(cmd)
      toast.success("已发布公告")
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
                加载中…
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
              <AnnouncementRow
                key={announcement.id}
                announcement={announcement}
                isDeleting={deleteMutation.isPending}
                onEdit={openEdit}
                onDelete={(id) => {
                  deleteMutation.mutateAsync(id).then(
                    () => toast.success("已删除公告"),
                    (err: unknown) => toast.error(getErrorMessage(err))
                  )
                }}
              />
            ))
          )}
        </TableBody>
      </Table>
    </section>
  )
}
