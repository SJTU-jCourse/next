import { RiShieldCrossLine, RiShieldUserLine } from "@remixicon/react"
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

interface RevokeAdminDialogProps {
  username: string
  disabled: boolean
  onConfirm: () => void
}

export function RevokeAdminDialog({
  username,
  disabled,
  onConfirm,
}: RevokeAdminDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:hover:bg-destructive/20"
          disabled={disabled}
        >
          <RiShieldCrossLine />
          撤销管理员权限
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

interface GrantAdminDialogProps {
  username: string
  disabled: boolean
  onConfirm: () => void
}

export function GrantAdminDialog({
  username,
  disabled,
  onConfirm,
}: GrantAdminDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled}>
          <RiShieldUserLine />
          授予管理员权限
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>授予管理员权限？</AlertDialogTitle>
          <AlertDialogDescription>
            将授予 {username} 管理员权限。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>授予</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
