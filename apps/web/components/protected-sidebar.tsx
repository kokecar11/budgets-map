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
  Check,
  Sun,
  Moon,
  Monitor,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
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
}

function SidebarUserExtras() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const t = useTranslations("settings")
  const tLang = useTranslations("languageSwitcher")

  function handleLocale(next: string) {
    startTransition(() => {
      router.replace(pathname, { locale: next as Locale })
    })
  }

  return (
    <>
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

export function ProtectedSidebar({ navItemConfigs, ...props }: ProtectedSidebarProps) {
  const navItems = navItemConfigs.map(({ key, title, url }) => ({
    title,
    url,
    icon: NAV_ICONS[key],
  }))
  return <AppSidebar {...props} navItems={navItems} navUserExtras={<SidebarUserExtras />} />
}
