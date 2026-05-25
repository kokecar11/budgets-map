import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import "@workspace/ui/globals.css"
import { getTranslations } from "next-intl/server"
import { auth } from "@/auth"
import { signOutAction } from "@/lib/actions"
import { ProtectedSidebar } from "@/components/protected-sidebar"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { SiteHeader } from "@workspace/ui/components/site-header"
import { SessionMonitor } from "@/components/session-monitor"
import { CurrencyProvider } from "@/contexts/currency-context"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, cookieStore, tNav, tCommon] = await Promise.all([
    auth(),
    cookies(),
    getTranslations("nav"),
    getTranslations("common"),
  ])

  if (!session) {
    redirect("/login")
  }
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  const navItemConfigs = [
    { key: "dashboard"    as const, title: tNav("dashboard"),    url: "/dashboard" },
    { key: "accounts"     as const, title: tNav("accounts"),     url: "/accounts" },
    { key: "categories"   as const, title: tNav("categories"),   url: "/categories" },
    { key: "transactions" as const, title: tNav("transactions"), url: "/transactions" },
    { key: "budgets"      as const, title: tNav("budgets"),      url: "/budgets" },
    { key: "savings"      as const, title: tNav("savings"),      url: "/savings" },
    { key: "loans"        as const, title: tNav("loans"),        url: "/loans" },
    { key: "creditCards"  as const, title: tNav("creditCards"),  url: "/credit-cards" },
    { key: "reports"      as const, title: tNav("reports"),      url: "/reports" },
    { key: "netWorth"     as const, title: tNav("netWorth"),     url: "/net-worth" },
  ]

  return (
    <CurrencyProvider initialCurrency={session.user.currency ?? "COP"}>
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
        } as React.CSSProperties
      }
    >
      <ProtectedSidebar
        variant="inset"
        brand={{ name: tNav("brandName"), tagline: tNav("brandTagline") }}
        navItemConfigs={navItemConfigs}
        user={{
          name: session?.user.name ?? "",
          email: session?.user.email ?? "",
          plan: session?.user.plan ?? "free",
        }}
        navUserLabels={{
          settings: tNav("settings"),
          signOut: tNav("signOut"),
          settingsUrl: "/settings",
          signOutAction,
        }}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
      <SessionMonitor />
    </SidebarProvider>
    </CurrencyProvider>
  )
}
