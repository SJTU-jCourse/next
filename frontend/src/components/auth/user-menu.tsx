import { useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { RiUserLine } from "@remixicon/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { toUserMessage } from "@/lib/error-message"

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logout()
      await navigate({ to: "/" })
    } catch (err) {
      toast.error(toUserMessage(err, "退出登录失败，请稍后再试"))
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/login">登录</Link>
        </Button>
        <Button variant="default" size="sm" asChild>
          <Link to="/register">注册</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-foreground"
            aria-label="打开用户菜单"
          >
            <span className="flex items-center justify-center">
              <RiUserLine aria-hidden="true" />
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            用户 ID：{user.id}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/review/mine">我的点评</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/course/mine">我的课程</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/point">我的积分</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/api-key">API Key</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings">设置</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
