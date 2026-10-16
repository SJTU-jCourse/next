import { RiKey2Line } from "@remixicon/react"
import { useState } from "react"
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

interface ResetPasswordDialogProps {
  userID: number
  defaultPassword: string
  disabled: boolean
  isPending: boolean
  isError: boolean
  errorMessage: string
  onSubmit: (password: string) => Promise<void>
}

export function ResetPasswordDialog({
  userID,
  defaultPassword,
  disabled,
  isPending,
  isError,
  errorMessage,
  onSubmit,
}: ResetPasswordDialogProps) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState(defaultPassword)

  function openDialog() {
    setPassword(defaultPassword)
    setOpen(true)
  }

  async function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault()
    await onSubmit(password)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          onClick={openDialog}
          disabled={disabled}
        >
          <RiKey2Line />
          重置密码
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>
              用户 {userID} 的密码将立即改为下方输入的新密码。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reset-password">新密码</Label>
            <Input
              id="reset-password"
              type="text"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
            <Button
              type="submit"
              disabled={isPending || password.trim() === ""}
            >
              重置密码
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
