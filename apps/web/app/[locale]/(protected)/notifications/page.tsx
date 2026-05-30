import { Bell } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { auth } from "@/auth"
import { budgetApi, budgetItemApi } from "@/features/budgets/api"
import { categoryApi } from "@/features/categories/api"
import type { Budget, BudgetItem } from "@/features/budgets/types"
import type { Category } from "@/features/categories/types"
import { BudgetAlerts } from "@/features/dashboard/budget-alerts"

export default async function NotificationsPage() {
  const session = await auth()
  const token = session?.accessToken ?? ""
  const t = await getTranslations("notifications")

  const now = new Date()
  let currentBudget: Budget | undefined
  let budgetItems: BudgetItem[] = []
  let categories: Category[] = []

  try {
    const [budgets, cats] = await Promise.all([
      budgetApi.list(token),
      categoryApi.list(token).catch(() => [] as Category[]),
    ])
    categories = cats
    currentBudget = budgets.find(
      (b) => b.month === now.getMonth() + 1 && b.year === now.getFullYear()
    )
    if (currentBudget) {
      budgetItems = await budgetItemApi.list(currentBudget.id, token).catch(() => [])
    }
  } catch {
    // Token expired or invalid — render empty state
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-4 px-6 py-5">
          <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
            <Bell className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
      </div>
      <BudgetAlerts
        budgetItems={budgetItems}
        categories={categories}
        warningPct={currentBudget?.alert_warning_pct ?? 80}
        dangerPct={currentBudget?.alert_danger_pct ?? 100}
        emptyText={t("empty")}
      />
    </div>
  )
}
