import { Spinner } from "@/components/ui/spinner"

export function RouteFallback() {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center text-muted-foreground">
      <Spinner className="size-5" />
    </div>
  )
}
