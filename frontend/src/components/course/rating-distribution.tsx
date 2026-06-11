import type { RatingInfoDTO } from "@/api/course"
import { RiStarFill, RiStarLine } from "@remixicon/react"
import { Fragment } from "react"

interface RatingDistributionProps {
  rating: RatingInfoDTO
}

export function RatingDistribution({ rating }: RatingDistributionProps) {
  const total = Math.max(rating.count, 1)
  const filled = Math.round(rating.avg)
  const stars = Array.from({ length: 5 }, (_, i) => i < filled)

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-5 md:flex-col md:items-stretch md:gap-2.5">
      <div className="flex items-center justify-center gap-4">
        <div className="text-3xl font-bold tabular-nums">
          {rating.avg > 0 ? rating.avg.toFixed(1) : "—"}
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex">
            {stars.map((on, index) =>
              on ? (
                <RiStarFill key={index} className="size-3.5 text-yellow-400" />
              ) : (
                <RiStarLine
                  key={index}
                  className="size-3.5 text-muted-foreground/40"
                />
              )
            )}
          </div>
          <span className="text-center text-sm text-muted-foreground">
            {rating.count} 条点评
          </span>
        </div>
      </div>

      <div className="grid max-w-xs flex-1 grid-cols-[2rem_minmax(0,1fr)_max-content] items-center gap-x-1.5 gap-y-1 text-sm">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = rating.distribution[star - 1]
          const pct = (count / total) * 100
          return (
            <Fragment key={star}>
              <span className="w-8 shrink-0 text-muted-foreground">
                {star} 星
              </span>
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-yellow-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="shrink-0 whitespace-nowrap text-right text-muted-foreground tabular-nums">
                {count} 条点评
              </span>
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
