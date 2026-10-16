import { useState } from "react"
import { RiLockLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FormSubmitEvent } from "@/components/admin/admin-utils"

interface SuspendUserDialogProps {
  userID: number
  disabled: boolean
  isPending: boolean
  isError: boolean
  errorMessage: string
  onSubmit: (days: number) => Promise<void>
}

export function SuspendUserDialog({
  userID,
  disabled,
  isPending,
  isError,
  errorMessage,
  onSubmit,
}: SuspendUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [days, setDays] = useState(30)

  async function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault()
    await onSubmit(days)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive" disabled={disabled}>
          <RiLockLine />
          封禁用户
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle>封禁用户</DialogTitle>
            <DialogDescription>
              封禁期间，用户 {userID} 将无法登录或进行任何操作。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="suspend-days">封禁天数</Label>
            <Input
              id="suspend-days"
              type="number"
              min={1}
              value={days}
              onChange={(event) =>
                setDays(Math.max(1, Number(event.target.value) || 30))
              }
              autoFocus
            />
          </div>

          {isError ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                取消
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={isPending}>
              封禁
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
