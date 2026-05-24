"use client"

import type { LucideIcon } from "lucide-react"
import { useLocale } from "next-intl"
import type { Locale } from "@/i18n/routing"
import { fmtCurrentMonthYear } from "@/lib/dates"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
}

export function PageHeader({ icon: Icon, title, subtitle }: PageHeaderProps) {
  const locale = useLocale() as Locale
  const date = fmtCurrentMonthYear(locale)

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center gap-4 px-6 py-5">
        <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
          <Icon className="size-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground capitalize">{subtitle ?? date}</p>
        </div>
      </div>
    </div>
  )
}
