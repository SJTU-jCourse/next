import { useState } from "react"
import { toast } from "sonner"
import { RiDeleteBinLine } from "@remixicon/react"
import type { ApiKeyDTO } from "@/api/api-key"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatNullableDateTime } from "@/lib/date"
import { LastUsedTableHead } from "./last-used-table-head"
import { toUserMessage } from "@/lib/error-message"

interface ApiKeyTableProps {
  apiKeys: ApiKeyDTO[]
  isLoading: boolean
  isDeleting: boolean
  emptyText: string
  deleteAriaLabel: string
  deleteDialogTitle: string
  deleteDialogDescription: string
  deleteActionLabel: string
  onDelete: (id: string) => Promise<void>
  getDeleteErrorMessage?: (error: unknown) => string
}

function defaultGetDeleteErrorMessage(error: unknown) {
  return toUserMessage(error, "删除失败，请稍后再试")
}

export function ApiKeyTable({
  apiKeys,
  isLoading,
  isDeleting,
  emptyText,
  deleteAriaLabel,
  deleteDialogTitle,
  deleteDialogDescription,
  deleteActionLabel,
  onDelete,
  getDeleteErrorMessage = defaultGetDeleteErrorMessage,
}: ApiKeyTableProps) {
  const [error, setError] = useState("")

  async function handleDelete(id: string) {
    setError("")
    try {
      await onDelete(id)
      toast.success("已删除 API Key")
    } catch (err) {
      setError(getDeleteErrorMessage(err))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (apiKeys.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名称</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead>
              <LastUsedTableHead />
            </TableHead>
            <TableHead className="w-16 text-right md:w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiKeys.map((key) => (
            <TableRow key={key.id}>
              <TableCell className="font-medium">{key.name}</TableCell>
              <TableCell>
                <code className="rounded bg-muted px-2 py-1 text-xs">
                  {key.key}
                </code>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatNullableDateTime(key.created_at)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatNullableDateTime(key.last_used_at, "从未使用")}
              </TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost-destructive"
                      size="icon-sm"
                      aria-label={deleteAriaLabel}
                      disabled={isDeleting}
                    >
                      <RiDeleteBinLine />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{deleteDialogTitle}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {deleteDialogDescription}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => handleDelete(key.id)}
                      >
                        {deleteActionLabel}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
