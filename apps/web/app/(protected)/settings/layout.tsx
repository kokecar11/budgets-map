"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Settings } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { PageHeader } from "@/components/page-header"

const NAV_ITEMS = [
  { label: "General",      href: "/settings" },
  { label: "Cuenta",       href: "/settings/account" },
  { label: "Facturación",  href: "/settings/billing" },
  { label: "Privacidad",   href: "/settings/privacy" },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const activeLabel = NAV_ITEMS.find((item) => item.href === pathname)?.label ?? "Configuración"

  return (
    <div className="p-6 flex flex-col gap-6 min-h-full">
      <PageHeader icon={Settings} title="Configuración" subtitle={activeLabel} />

      <div className="flex gap-8 items-start">
        {/* Left nav */}
        <nav className="w-44 shrink-0 flex flex-col gap-0.5 sticky top-6">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-2xl flex flex-col gap-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
