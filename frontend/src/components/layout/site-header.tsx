import { Link, useLocation, useNavigate } from "@tanstack/react-router"
import { useLayoutEffect, useRef, useState } from "react"
import { RiMenuLine, RiSearchLine } from "@remixicon/react"
import { UserMenu } from "@/components/auth/user-menu"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { brand } from "@/config/brand"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"

type NavLinkItem = {
  to:
    | "/"
    | "/course"
    | "/teacher"
    | "/review"
    | "/course/hot"
    | "/admin/user"
    | "/admin/site-stat"
  label: string
  match: (p: string) => boolean
}

const navItems: NavLinkItem[] = [
  { to: "/", label: "首页", match: (p: string) => p === "/" },
  {
    to: "/course",
    label: "课程",
    match: (p: string) => p === "/course" || /^\/course\/\d+(?:\/|$)/.test(p),
  },
  {
    to: "/teacher",
    label: "教师",
    match: (p: string) => p.startsWith("/teacher"),
  },
  {
    to: "/review",
    label: "点评",
    match: (p: string) => p.startsWith("/review"),
  },
  {
    to: "/course/hot",
    label: "热门",
    match: (p: string) => p === "/course/hot",
  },
]

const adminNavItems: NavLinkItem[] = [
  {
    to: "/admin/user",
    label: "管理",
    match: (p: string) => p === "/admin/user" || p.startsWith("/admin/user/"),
  },
  {
    to: "/admin/site-stat",
    label: "站点统计",
    match: (p: string) =>
      p === "/admin/site-stat" || p.startsWith("/admin/site-stat/"),
  },
]

const searchTargets = [
  { label: "课程", path: "/course" },
  { label: "教师", path: "/teacher" },
  { label: "点评", path: "/review" },
] as const

function HeaderSearch() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const keyword = query.trim()

  function go(path: (typeof searchTargets)[number]["path"]) {
    if (!keyword) return

    void navigate({
      to: path,
      search: { q: keyword },
    })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-foreground"
          aria-expanded={open}
          aria-label="搜索"
          data-shortcut-target="site-search"
        >
          <RiSearchLine />
          <span className="sr-only">搜索</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(calc(100vw-2rem),20rem)]"
      >
        <Command shouldFilter={false} loop>
          <CommandInput
            autoFocus
            aria-label="搜索关键词"
            placeholder="输入关键词搜索课程、教师或点评"
            value={query}
            onValueChange={setQuery}
          />

          {keyword && (
            <CommandList>
              {searchTargets.map((target) => (
                <CommandItem
                  key={target.path}
                  value={target.path}
                  onSelect={() => go(target.path)}
                >
                  在{target.label}中搜索“{keyword}”
                </CommandItem>
              ))}
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function SiteHeader() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const visibleNavItems: NavLinkItem[] = user?.is_admin()
    ? [...navItems, ...adminNavItems]
    : navItems
  const activeIndex = visibleNavItems.findIndex((item) => item.match(pathname))
  const [navIndicator, setNavIndicator] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  })

  useLayoutEffect(() => {
    function updateIndicator() {
      const nav = navRef.current
      const activeLink =
        nav?.querySelectorAll<HTMLElement>("[data-nav-item]")[activeIndex]

      if (!activeLink) {
        setNavIndicator((current) => ({ ...current, opacity: 0 }))
        return
      }

      setNavIndicator({
        left: activeLink.offsetLeft,
        width: activeLink.offsetWidth,
        opacity: 1,
      })
    }

    updateIndicator()
    window.addEventListener("resize", updateIndicator)
    return () => window.removeEventListener("resize", updateIndicator)
  }, [activeIndex])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-360 items-center px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">{brand.name}</span>
        </Link>

        {/* Desktop nav */}
        <nav
          ref={navRef}
          aria-label="主导航"
          className="relative ml-8 hidden h-full gap-4 text-sm md:flex"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-primary transition-[left,width,opacity] duration-200 ease-out dark:bg-primary"
            style={navIndicator}
          />
          {visibleNavItems.map((item) => {
            const active = item.match(pathname)
            return (
              <Link
                key={item.to}
                to={item.to}
                data-nav-item
                className={
                  active
                    ? "flex items-center font-medium text-primary transition-colors dark:text-primary"
                    : "flex items-center text-foreground transition-colors hover:text-primary"
                }
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <HeaderSearch />

          {/* Mobile menu trigger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-foreground md:hidden"
              >
                <RiMenuLine />
                <span className="sr-only">菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>导航</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {visibleNavItems.map((item) => {
                  const active = item.match(pathname)
                  return (
                    <SheetClose asChild key={item.to}>
                      <Link
                        to={item.to}
                        className={
                          active
                            ? "rounded-md bg-primary/10 px-3 py-2 font-medium text-primary dark:bg-primary/18 dark:text-primary"
                            : "rounded-md px-3 py-2 text-foreground transition-colors hover:bg-accent hover:text-primary"
                        }
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <UserMenu />
        </div>
      </div>
    </header>
  )
}
