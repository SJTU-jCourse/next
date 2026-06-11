import { cn } from "@/lib/utils"
import { SafeMarkdown } from "./safe-markdown"

interface ReviewMarkdownProps {
  content: string
  className?: string
}

const reviewMarkdownClassName =
  "review-markdown prose prose-sm min-w-0 max-w-none text-sm dark:prose-invert"

export function ReviewMarkdown({ content, className }: ReviewMarkdownProps) {
  return (
    <div className={cn(reviewMarkdownClassName, className)}>
      <SafeMarkdown content={content} />
    </div>
  )
}
