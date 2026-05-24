"use client"

import { Settings } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@workspace/ui/lib/utils"
import { PageHeader } from "@/components/page-header"
import { Link, usePathname } from "@/i18n/navigation"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("settings")
  const tNav = useTranslations("nav")
  const pathname = usePathname()

  const NAV_ITEMS = [
    { label: t("general"),  href: "/settings" },
    { label: t("account"),  href: "/settings/account" },
    { label: t("billing"),  href: "/settings/billing" },
    { label: t("privacy"),  href: "/settings/privacy" },
  ]

  const activeLabel = NAV_ITEMS.find((item) => item.href === pathname)?.label ?? tNav("settings")

  return (
    <div className="p-6 flex flex-col gap-6 min-h-full">
      <PageHeader icon={Settings} title={tNav("settings")} subtitle={activeLabel} />

      <div className="flex gap-8 items-start">
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

        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-2xl flex flex-col gap-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
