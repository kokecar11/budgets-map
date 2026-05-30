import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import "@workspace/ui/globals.css"
import { getTranslations } from "next-intl/server"
import { auth } from "@/auth"
import { signOutAction } from "@/lib/actions"
import { budgetApi, budgetItemApi } from "@/features/budgets/api"
import { computeBudgetAlerts } from "@/features/budgets/alerts"
import { financialRulesApi } from "@/features/financial-rules/api"
import type { FinancialRules } from "@/features/financial-rules/types"
import { ProtectedSidebar } from "@/components/protected-sidebar"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { SiteHeader } from "@workspace/ui/components/site-header"
import { SessionMonitor } from "@/components/session-monitor"
import { CurrencyProvider } from "@/contexts/currency-context"
import { FinancialRulesProvider } from "@/contexts/financial-rules-context"

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

  const token = session.accessToken ?? ""

  // Compute current-month budget alert count for the user-menu badge
  let alertCount = 0
  try {
    const now = new Date()
    const budgets = await budgetApi.list(token)
    const currentBudget = budgets.find(
      (b) => b.month === now.getMonth() + 1 && b.year === now.getFullYear()
    )
    if (currentBudget) {
      const items = await budgetItemApi.list(currentBudget.id, token)
      alertCount = computeBudgetAlerts(
        items,
        currentBudget.alert_warning_pct,
        currentBudget.alert_danger_pct
      ).length
    }
  } catch {
    alertCount = 0
  }

  // Financial rules (expense model, etc.) — seed the client provider
  let financialRules: FinancialRules
  try {
    financialRules = await financialRulesApi.get(token)
  } catch {
    financialRules = { id: "", user_id: session.user.id ?? "", expense_model: "accrual" }
  }

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
    <FinancialRulesProvider initialRules={financialRules}>
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
        alertCount={alertCount}
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
    </FinancialRulesProvider>
    </CurrencyProvider>
  )
}
