"use client"

import { startTransition } from "react"
import {
  LayoutDashboard,
  Wallet,
  Tags,
  ArrowLeftRight,
  CalendarRange,
  PiggyBank,
  Landmark,
  CreditCard,
  BarChart3,
  TrendingUp,
  Bell,
  Check,
  Sun,
  Moon,
  Monitor,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Link, useRouter, usePathname } from "@/i18n/navigation"
import { useTheme } from "next-themes"
import { AppSidebar } from "@workspace/ui/components/app-sidebar"
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@workspace/ui/components/dropdown-menu"
import type { NavUserLabels } from "@workspace/ui/components/nav-user"
import type { ComponentProps } from "react"
import type { Sidebar } from "@workspace/ui/components/sidebar"
import type { Locale } from "@/i18n/routing"

const NAV_ICONS = {
  dashboard: LayoutDashboard,
  accounts: Wallet,
  categories: Tags,
  transactions: ArrowLeftRight,
  budgets: CalendarRange,
  savings: PiggyBank,
  loans: Landmark,
  creditCards: CreditCard,
  reports: BarChart3,
  netWorth: TrendingUp,
} as const

type NavKey = keyof typeof NAV_ICONS

export interface NavItemConfig {
  key: NavKey
  title: string
  url: string
}

interface ProtectedSidebarProps extends ComponentProps<typeof Sidebar> {
  brand: { name: string; tagline: string }
  navItemConfigs: NavItemConfig[]
  user: { name: string; email: string; avatar?: string; plan?: string }
  navUserLabels: NavUserLabels
  alertCount: number
}

function SidebarUserExtras({ alertCount }: { alertCount: number }) {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const t = useTranslations("settings")
  const tNav = useTranslations("nav")
  const tLang = useTranslations("languageSwitcher")

  function handleLocale(next: string) {
    startTransition(() => {
      router.replace(pathname, { locale: next as Locale })
    })
  }

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/notifications">
          <Bell className="size-4" />
          {tNav("notifications")}
          {alertCount > 0 && (
            <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-[10px] font-semibold px-1.5 min-w-5 h-5">
              {alertCount}
            </span>
          )}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuLabel className="px-2 py-1 text-xs font-normal text-muted-foreground">
          {t("language")}
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleLocale("en")}>
          <Check className={`size-4 ${locale === "en" ? "opacity-100" : "opacity-0"}`} />
          {tLang("en")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLocale("es")}>
          <Check className={`size-4 ${locale === "es" ? "opacity-100" : "opacity-0"}`} />
          {tLang("es")}
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuLabel className="px-2 py-1 text-xs font-normal text-muted-foreground">
          {t("colorMode")}
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Check className={`size-4 ${theme === "light" ? "opacity-100" : "opacity-0"}`} />
          <Sun className="size-4" />
          {t("light")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Check className={`size-4 ${theme === "dark" ? "opacity-100" : "opacity-0"}`} />
          <Moon className="size-4" />
          {t("dark")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Check className={`size-4 ${theme === "system" ? "opacity-100" : "opacity-0"}`} />
          <Monitor className="size-4" />
          {t("system")}
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </>
  )
}

export function ProtectedSidebar({ navItemConfigs, alertCount, ...props }: ProtectedSidebarProps) {
  const navItems = navItemConfigs.map(({ key, title, url }) => ({
    title,
    url,
    icon: NAV_ICONS[key],
  }))
  return <AppSidebar {...props} navItems={navItems} navUserExtras={<SidebarUserExtras alertCount={alertCount} />} />
}
