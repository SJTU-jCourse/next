import { Link } from "@tanstack/react-router"
import { toast } from "sonner"
import {
  RiEyeCloseLine,
  RiNotification3Line,
  RiStarLine,
} from "@remixicon/react"
import type { CourseNotificationLevel } from "@/api/course"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { useSetNotificationLevel } from "@/hooks/use-course"
import { toUserMessage } from "@/lib/error-message"

const notificationLabels: Record<CourseNotificationLevel, string> = {
  0: "不关注",
  1: "关注",
  2: "屏蔽",
}

const notificationDescriptions: Record<CourseNotificationLevel, string> = {
  0: "默认状态，点评正常显示",
  1: "在首页和关注动态中查看该课程的新点评",
  2: "在点评列表和点评搜索中隐藏该课程的点评",
}

const notificationOptions = [
  { level: 0, Icon: RiNotification3Line },
  { level: 1, Icon: RiStarLine },
  { level: 2, Icon: RiEyeCloseLine },
] satisfies Array<{
  level: CourseNotificationLevel
  Icon: typeof RiNotification3Line
}>

interface CourseNotificationControlProps {
  courseID: number
  level: CourseNotificationLevel
}

export function CourseNotificationControl({
  courseID,
  level,
}: CourseNotificationControlProps) {
  const { user } = useAuth()
  const mutation = useSetNotificationLevel()

  function handleChange(value: string) {
    const nextLevel = Number(value) as CourseNotificationLevel
    mutation.mutate(
      { courseID, level: nextLevel },
      {
        onSuccess: () =>
          toast.success(
            nextLevel === 0
              ? "已恢复为不关注"
              : `已${notificationLabels[nextLevel]}该课程`
          ),
        onError: (err) =>
          toast.error(toUserMessage(err, "设置失败，请稍后再试")),
      }
    )
  }

  if (!user) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="font-normal">登录后可设置关注状态</span>
        <Button asChild size="xs" variant="ghost">
          <Link to="/login">登录</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <span className="font-normal" id={`course-${courseID}-follow-label`}>
        关注状态
      </span>
      <Select
        value={String(level)}
        onValueChange={handleChange}
        disabled={mutation.isPending}
      >
        <SelectTrigger
          size="sm"
          aria-labelledby={`course-${courseID}-follow-label`}
        >
          <SelectValue>{notificationLabels[level]}</SelectValue>
        </SelectTrigger>
        <SelectContent className="min-w-64">
          {notificationOptions.map(({ level: optionLevel, Icon }) => (
            <SelectItem
              key={optionLevel}
              value={String(optionLevel)}
              textValue={notificationLabels[optionLevel]}
              className="items-start py-2"
            >
              <Icon className="mt-0.5" data-icon="inline-start" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-medium">
                  {notificationLabels[optionLevel]}
                </span>
                <span className="text-sm leading-4 text-muted-foreground">
                  {notificationDescriptions[optionLevel]}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
