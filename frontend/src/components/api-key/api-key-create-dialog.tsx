import { useState, type SyntheticEvent } from "react"
import { RiFileCopyLine } from "@remixicon/react"
import type { ApiKeyDTO, CreateApiKeyCommand } from "@/api/api-key"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ApiKeyCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (cmd: CreateApiKeyCommand) => Promise<ApiKeyDTO>
  isCreating: boolean
  title: string
  description: string
  nameInputID: string
  namePlaceholder: string
  getErrorMessage?: (error: unknown) => string
}

function defaultGetErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "创建失败"
}

export function ApiKeyCreateDialog({
  open,
  onOpenChange,
  onCreate,
  isCreating,
  title,
  description,
  nameInputID,
  namePlaceholder,
  getErrorMessage = defaultGetErrorMessage,
}: ApiKeyCreateDialogProps) {
  const [name, setName] = useState("")
  const [createdKey, setCreatedKey] = useState<ApiKeyDTO | null>(null)
  const [copyMessage, setCopyMessage] = useState("")
  const [error, setError] = useState("")

  async function copyKey(value: string) {
    setCopyMessage("")
    try {
      await navigator.clipboard.writeText(value)
      setCopyMessage("已复制")
    } catch {
      setCopyMessage("复制失败")
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setName("")
      setCreatedKey(null)
      setCopyMessage("")
      setError("")
    }
  }

  async function handleCreate(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError("请输入名称")
      return
    }

    setError("")
    setCopyMessage("")
    try {
      const key = await onCreate({ name: trimmed })
      setCreatedKey(key)
      setName("")
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {createdKey?.key ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start gap-3">
              <code className="min-w-0 flex-1 rounded-md border bg-muted/30 px-3 py-2 text-sm break-all">
                {createdKey.key}
              </code>
              <Button
                type="button"
                variant="outline"
                onClick={() => copyKey(createdKey.key)}
              >
                <RiFileCopyLine data-icon="inline-start" />
                复制
              </Button>
            </div>
            {copyMessage ? (
              <p className="text-sm text-muted-foreground">{copyMessage}</p>
            ) : null}
            <DialogFooter>
              <DialogClose asChild>
                <Button>完成</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="space-y-2">
              <Label htmlFor={nameInputID}>名称</Label>
              <Input
                id={nameInputID}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={namePlaceholder}
                maxLength={80}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  取消
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "创建中" : "创建"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
