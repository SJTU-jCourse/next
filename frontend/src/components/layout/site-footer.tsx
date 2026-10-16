import { Link } from "@tanstack/react-router"
import { brand } from "@/config/brand"

const footerLinks = [
  { to: "/about", label: "关于" },
  { to: "/faq", label: "常见问题" },
]

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-360 flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {year} {brand.name} 保留所有权利
        </p>
        <nav className="flex gap-4" aria-label="页脚导航">
          {footerLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
