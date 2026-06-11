import { cn } from "@/lib/utils"
import { SafeMarkdown } from "./safe-markdown"

interface ReviewMarkdownProps {
  content: string
  className?: string
}

const reviewMarkdownClassName =
  "prose prose-sm max-w-none text-sm dark:prose-invert [&_blockquote]:leading-5 [&_li]:leading-5 [&_ol]:my-1.5 [&_p]:my-1.5 [&_p]:leading-5 [&_ul]:my-1.5"

export function ReviewMarkdown({ content, className }: ReviewMarkdownProps) {
  return (
    <div className={cn(reviewMarkdownClassName, className)}>
      <SafeMarkdown content={content} />
    </div>
  )
}
