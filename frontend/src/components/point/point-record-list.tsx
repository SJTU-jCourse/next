import { RiCoinLine } from "@remixicon/react"
import type { PointRecordDTO } from "@/api/point"
import { EmptyState } from "@/components/common/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateTime } from "@/lib/date"
import { cn } from "@/lib/utils"

export function PointRecordList({ records }: { records: PointRecordDTO[] }) {
  if (records.length === 0) {
    return (
      <EmptyState
        className="py-8"
        icon={<RiCoinLine />}
        title="暂无积分记录"
        description="发布点评后，获得的积分会显示在这里"
      />
    )
  }
  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>说明</TableHead>
            <TableHead className="w-24 text-right">积分</TableHead>
            <TableHead className="text-right">时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r, i) => (
            <TableRow key={`${r.created_at}-${i}`}>
              <TableCell className="font-medium">{r.description}</TableCell>
              <TableCell
                className={cn(
                  "text-right font-medium tabular-nums",
                  r.amount >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {r.amount >= 0 ? `+${r.amount}` : r.amount}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatDateTime(r.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
