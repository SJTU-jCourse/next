import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function LastUsedTableHead() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex cursor-help items-center underline decoration-dotted underline-offset-4"
          tabIndex={0}
        >
          最后使用
        </span>
      </TooltipTrigger>
      <TooltipContent>数据延迟约 5 分钟</TooltipContent>
    </Tooltip>
  )
}
