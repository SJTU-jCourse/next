import { RiRefreshLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CourseEnrollmentSyncDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  semester: string
  semesters: { name: string }[]
  onSemesterChange: (semester: string) => void
  onStartSync: () => void
}

export function CourseEnrollmentSyncDialog({
  open,
  onOpenChange,
  semester,
  semesters,
  onSemesterChange,
  onStartSync,
}: CourseEnrollmentSyncDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>同步课表</DialogTitle>
          <DialogDescription>
            选择学期后将打开 jAccount 授权窗口，同步完成后会自动刷新选课记录。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="enrollment-sync-semester">学期</Label>
          <Select value={semester} onValueChange={onSemesterChange}>
            <SelectTrigger id="enrollment-sync-semester" className="w-full">
              <SelectValue placeholder="选择学期" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((s) => (
                <SelectItem key={s.name} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onStartSync} disabled={!semester}>
            <RiRefreshLine data-icon="inline-start" />
            开始同步
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
