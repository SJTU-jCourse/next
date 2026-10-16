import {
  RiDeleteBinLine,
  RiEditLine,
  RiExternalLinkLine,
} from "@remixicon/react"
import type { AnnouncementDTO } from "@/api/announcement"
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
import { TableCell, TableRow } from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatDateTime } from "@/lib/date"

interface AnnouncementRowProps {
  announcement: AnnouncementDTO
  isDeleting: boolean
  onEdit: (announcement: AnnouncementDTO) => void
  onDelete: (id: number) => void
}

export function AnnouncementRow({
  announcement,
  isDeleting,
  onEdit,
  onDelete,
}: AnnouncementRowProps) {
  return (
    <TableRow>
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
      <TableCell>{formatDateTime(announcement.created_at)}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label="编辑公告"
                onClick={() => onEdit(announcement)}
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
                <AlertDialogTitle>删除公告？</AlertDialogTitle>
                <AlertDialogDescription>
                  删除后该公告将不再展示，此操作无法撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={() => onDelete(announcement.id)}
                >
                  删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  )
}
