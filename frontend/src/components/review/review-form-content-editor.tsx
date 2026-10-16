import { Link } from "@tanstack/react-router"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { SafeMarkdown } from "./safe-markdown"
import {
  addTemplateLine,
  CONTENT_MAX_LENGTH,
  CONTENT_MIN_LENGTH,
  hasTemplateLine,
  removeTemplateLine,
  REVIEW_TEMPLATE_LABELS,
} from "./review-form-template"

interface ReviewFormContentEditorProps {
  content: string
  error: string | null
  onChange: (content: string) => void
  onBlur: () => void
}

export function ReviewFormContentEditor({
  content,
  error,
  onChange,
  onBlur,
}: ReviewFormContentEditorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="content">点评内容</Label>
      <div className="flex flex-wrap gap-2">
        {REVIEW_TEMPLATE_LABELS.map((label) => {
          const selected = hasTemplateLine(content, label)
          return (
            <button
              key={label}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                onChange(
                  selected
                    ? removeTemplateLine(content, label)
                    : addTemplateLine(content, label)
                )
              }}
              className={cn(
                "inline-flex h-6 items-center justify-center rounded-4xl border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                selected
                  ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/15"
                  : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              <span>{label.replace(/：$/, "")}</span>
            </button>
          )
        })}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">编辑</p>
          <Textarea
            id="content"
            placeholder="分享你对这门课程的看法（支持 Markdown）"
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error ? "content-error content-count" : "content-count"
            }
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            maxLength={CONTENT_MAX_LENGTH}
            rows={10}
            className="resize-y font-sans text-sm"
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">预览</p>
          <div className="review-markdown prose prose-sm min-h-40 max-w-none dark:prose-invert">
            {content.trim() ? (
              <SafeMarkdown content={content} />
            ) : (
              <span className="text-muted-foreground italic">
                输入内容后在此预览
              </span>
            )}
          </div>
        </div>
      </div>
      <p id="content-count" className="text-sm text-muted-foreground">
        {content.length} / {CONTENT_MAX_LENGTH} 字，至少 {CONTENT_MIN_LENGTH} 字
      </p>
      {error && (
        <p id="content-error" className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="text-sm leading-6 text-muted-foreground [&_p]:m-0">
        <p>
          欢迎畅所欲言。点评模板可按需修改或删除，编辑框支持 Markdown 语法。
        </p>
        <p>
          理想的点评应基于事实，并尽量全面地描述课程。例如课讲得好但考核严格，或作业量大但给分宽松——把两方面都写出来，更有助于同学们做出全面的判断。
        </p>
        <p>
          请避免滥用缩写、梗、隐喻等让其他读者难以理解的表达，也请避免情绪化用语和冒犯性言论。
        </p>
        <p>
          发布点评即表示你同意授权选课社区使用点评内容，并已了解选课社区的
          <Link to="/faq" className="font-medium text-primary hover:underline">
            相关立场
          </Link>
          。
        </p>
      </div>
    </div>
  )
}
