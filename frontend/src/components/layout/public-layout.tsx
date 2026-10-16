import { Link, Outlet } from "@tanstack/react-router"
import { brand } from "@/config/brand"

function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-360 items-center px-4">
        <Link to="/login" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">{brand.name}</span>
        </Link>
      </div>
    </header>
  )
}

export function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}
