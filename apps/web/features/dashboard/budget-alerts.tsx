"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, XCircle, X, Bell } from "lucide-react"
import { useTranslations } from "next-intl"
import type { BudgetItem } from "@/features/budgets/types"
import type { Category } from "@/features/categories/types"
import { useCurrency } from "@/hooks/use-currency"

interface BudgetAlertsProps {
  budgetItems: BudgetItem[]
  categories: Category[]
  warningPct?: number
  dangerPct?: number
}

interface Alert {
  id: string
  level: "warning" | "danger"
  categoryName: string
  spent: number
  planned: number
  pct: number
}

export function BudgetAlerts({
  budgetItems,
  categories,
  warningPct = 80,
  dangerPct = 100,
}: BudgetAlertsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const t = useTranslations("dashboard")

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  const alerts = useMemo<Alert[]>(() => {
    const result: Alert[] = []
    for (const item of budgetItems) {
      if (item.planned_amount <= 0) continue
      const spent = item.actual_amount ?? (item.is_paid ? item.planned_amount : 0)
      if (spent === 0) continue
      const pct = (spent / item.planned_amount) * 100
      if (pct < warningPct) continue
      result.push({
        id: item.id,
        level: pct >= dangerPct ? "danger" : "warning",
        categoryName: (item.category_id ? categoryMap[item.category_id] : null) ?? item.description,
        spent,
        planned: item.planned_amount,
        pct,
      })
    }
    return result.sort((a, b) => b.pct - a.pct)
  }, [budgetItems, categoryMap, warningPct, dangerPct])

  const visible = alerts.filter((a) => !dismissed.has(a.id))
  if (visible.length === 0) return null

  const fmt = useCurrency()

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b bg-muted/30">
        <Bell className="size-4 text-muted-foreground shrink-0" />
        <p className="text-sm font-semibold">{t("budgetAlerts")}</p>
        <span className="ml-auto text-xs text-muted-foreground">{t("alertCount", { count: visible.length })}</span>
      </div>

      <div className="divide-y">
        {visible.map((alert) => {
          const isDanger = alert.level === "danger"
          return (
            <div
              key={alert.id}
              className={`flex items-center gap-4 px-5 py-3.5 ${
                isDanger ? "bg-red-500/5" : "bg-yellow-500/5"
              }`}
            >
              {isDanger ? (
                <XCircle className="size-5 text-red-500 shrink-0" />
              ) : (
                <AlertTriangle className="size-5 text-yellow-500 shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{alert.categoryName}</p>
                <p className={`text-xs mt-0.5 ${isDanger ? "text-red-500" : "text-yellow-600 dark:text-yellow-400"}`}>
                  {isDanger
                    ? t("budgetExceeded", { spent: fmt(alert.spent), planned: fmt(alert.planned) })
                    : t("budgetWarning", { pct: alert.pct.toFixed(0), spent: fmt(alert.spent), planned: fmt(alert.planned) })}
                </p>
              </div>

              {/* Mini progress bar */}
              <div className="w-24 shrink-0">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isDanger ? "bg-red-500" : "bg-yellow-400"}`}
                    style={{ width: `${Math.min(alert.pct, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                  {alert.pct.toFixed(0)}%
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDismissed((prev) => new Set(prev).add(alert.id))}
                className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                title={t("dismissAlert")}
              >
                <X className="size-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
