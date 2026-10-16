import { useState } from "react"
import { RiStarFill, RiStarLine } from "@remixicon/react"
import { cn } from "@/lib/utils"

interface RatingStarsProps {
  value: number
  onChange?: (value: number) => void
  size?: "sm" | "md" | "lg"
  readOnly?: boolean
}

interface StarRowProps {
  /** 0–5，会四舍五入到整星 */
  value: number
  className?: string
  starClassName?: string
}

/** 只读星级：对读屏只读出一次“评分 N/5”，避免逐颗播报 */
export function StarRow({ value, className, starClassName }: StarRowProps) {
  const filled = Math.round(value)
  return (
    <span
      role="img"
      aria-label={`评分 ${filled}/5`}
      className={cn("inline-flex", className)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const Icon = star <= filled ? RiStarFill : RiStarLine
        return (
          <Icon
            key={star}
            aria-hidden
            className={cn(
              "size-3.5",
              star <= filled ? "text-rating" : "text-muted-foreground/40",
              starClassName
            )}
          />
        )
      })}
    </span>
  )
}

export function RatingStars({
  value,
  onChange,
  size = "md",
  readOnly,
}: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const [pulseKey, setPulseKey] = useState(0)
  const sizeClass =
    size === "sm" ? "size-4" : size === "lg" ? "size-6" : "size-5"
  const interactive = !readOnly && onChange
  const displayValue = interactive ? (hoverValue ?? value) : value

  if (!interactive) {
    return (
      <StarRow value={value} starClassName={sizeClass} className="gap-0.5" />
    )
  }

  function handleSelect(star: number) {
    if (!interactive) return
    onChange(star)
    setPulseKey((key) => key + 1)
  }

  return (
    <div
      role="radiogroup"
      aria-label="评分"
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => setHoverValue(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue
        const selected = star <= value
        const shouldPulse = pulseKey > 0 && selected
        const Icon = filled ? RiStarFill : RiStarLine
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            onClick={() => handleSelect(star)}
            onFocus={() => setHoverValue(star)}
            onBlur={() => setHoverValue(null)}
            onMouseEnter={() => setHoverValue(star)}
            className={cn(
              "-m-0.5 rounded-sm p-0.5 transition-transform duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
              "cursor-pointer hover:-translate-y-0.5 hover:scale-110 active:scale-95"
            )}
            aria-label={`${star} 星`}
          >
            <Icon
              key={shouldPulse ? `pulse-${pulseKey}` : "idle"}
              className={cn(
                sizeClass,
                "transition-[color,filter,transform] duration-150 ease-out",
                filled
                  ? "text-rating drop-shadow-sm"
                  : "text-muted-foreground/40",
                shouldPulse && "animate-rating-pop"
              )}
              style={
                shouldPulse
                  ? { animationDelay: `${(star - 1) * 35}ms` }
                  : undefined
              }
            />
          </button>
        )
      })}
    </div>
  )
}
