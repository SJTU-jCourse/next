import { RiShieldCrossLine } from "@remixicon/react"
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

interface RevokeAdminIconDialogProps {
  username: string
  disabled: boolean
  onConfirm: () => void
}

export function RevokeAdminIconDialog({
  username,
  disabled,
  onConfirm,
}: RevokeAdminIconDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost-destructive"
          size="icon-sm"
          aria-label={`撤销 ${username} 的管理员权限`}
          disabled={disabled}
        >
          <RiShieldCrossLine />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>撤销管理员权限？</AlertDialogTitle>
          <AlertDialogDescription>
            将撤销 {username} 的管理员权限。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            撤销
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
