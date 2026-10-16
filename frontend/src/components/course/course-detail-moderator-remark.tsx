import { useState } from "react"
import { RiEditLine, RiShieldUserLine } from "@remixicon/react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CourseModeratorRemarkDialog } from "./course-moderator-remark-dialog"
import type { CourseDetailDTO } from "@/api/course"

export function CourseModeratorRemark({ course }: { course: CourseDetailDTO }) {
  const trimmed = (course.moderator_remark ?? "").trim()
  if (!trimmed) return null

  return (
    <Alert variant="info" role="note">
      <RiShieldUserLine />
      <AlertTitle>管理员备注</AlertTitle>
      <AlertDescription className="whitespace-pre-wrap text-foreground/90">
        {trimmed}
      </AlertDescription>
    </Alert>
  )
}

export function CourseModeratorRemarkButton({
  course,
}: {
  course: CourseDetailDTO
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
        aria-label="编辑管理员备注"
        title="编辑管理员备注"
      >
        <RiEditLine />
      </Button>
      <CourseModeratorRemarkDialog
        course={course}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
