import { TeacherCard } from "./teacher-card"
import { Skeleton } from "@/components/ui/skeleton"
import type { TeacherDTO } from "@/api/teacher"

interface TeacherListProps {
  teachers: TeacherDTO[]
  isLoading?: boolean
}

function TeacherCardSkeleton() {
  return (
    <div className="space-y-1.5 border-b px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-4 w-40" />
    </div>
  )
}

export function TeacherList({ teachers, isLoading }: TeacherListProps) {
  if (isLoading) {
    return (
      <div className="border-t">
        {Array.from({ length: 6 }).map((_, i) => (
          <TeacherCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (teachers.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">暂无教师</p>
      </div>
    )
  }

  return (
    <div className="border-t">
      {teachers.map((teacher) => (
        <TeacherCard key={teacher.id} teacher={teacher} />
      ))}
    </div>
  )
}
