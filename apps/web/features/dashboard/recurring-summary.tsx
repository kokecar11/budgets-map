"use client"

import { useMemo } from "react"
import { RefreshCw, CheckCircle2, Clock } from "lucide-react"
import { useTranslations } from "next-intl"
import type { Transaction } from "@/features/transactions/types"
import type { Category } from "@/features/categories/types"
import { parseDateParts } from "@/lib/dates"
import { useCurrency } from "@/hooks/use-currency"

interface RecurringItem {
  key: string
  description: string
  type: Transaction["type"]
  amount: number
  categoryName: string | null
  occurredThisMonth: boolean
}

interface RecurringSummaryProps {
  transactions: Transaction[]
  categories: Category[]
  currentMonth: number
  currentYear: number
}

// TYPE_LABELS are now handled via useTranslations("dashboard") in the component

export function RecurringSummary({
  transactions,
  categories,
  currentMonth,
  currentYear,
}: RecurringSummaryProps) {
  const t = useTranslations("dashboard")
  const fmt = useCurrency()

  const TYPE_LABELS: Record<Transaction["type"], string> = {
    income: t("typeIncome"),
    expense: t("typeExpense"),
    transfer: t("typeTransfer"),
    saving: t("typeSaving"),
  }
  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  )

  const items = useMemo<RecurringItem[]>(() => {
    const recurring = transactions.filter((t) => t.is_recurring && t.recurrence === "monthly")

    // Track which "keys" already occurred this month
    const occurredKeys = new Set<string>()
    for (const t of recurring) {
      const { month, year } = parseDateParts(t.date)
      if (month === currentMonth && year === currentYear) {
        occurredKeys.add(`${t.description}|${t.type}|${Math.round(t.amount)}`)
      }
    }

    // Build unique recurring commitments from most recent historical occurrence
    const templateMap = new Map<string, Transaction>()
    for (const t of recurring) {
      const key = `${t.description}|${t.type}|${Math.round(t.amount)}`
      const existing = templateMap.get(key)
      if (!existing || t.date > existing.date) {
        templateMap.set(key, t)
      }
    }

    return Array.from(templateMap.entries())
      .map(([key, tx]) => ({
        key,
        description: tx.description ?? "",
        type: tx.type,
        amount: tx.amount,
        categoryName: tx.category_id ? (categoryMap[tx.category_id] ?? null) : null,
        occurredThisMonth: occurredKeys.has(key),
      }))
      .sort((a, b) => {
        if (a.occurredThisMonth !== b.occurredThisMonth)
          return a.occurredThisMonth ? 1 : -1
        return b.amount - a.amount
      })
  }, [transactions, categories, categoryMap, currentMonth, currentYear])

  if (items.length === 0) return null

  const pending = items.filter((i) => !i.occurredThisMonth)
  const occurred = items.filter((i) => i.occurredThisMonth)
  const totalPending = pending.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
            <RefreshCw className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">{t("recurringTitle")}</p>
            <p className="text-xs text-muted-foreground">
              {totalPending > 0
                ? t("recurringWithAmount", { executed: occurred.length, pending: pending.length, amount: fmt(totalPending) })
                : t("recurringSubtitle", { executed: occurred.length, pending: pending.length })}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-4 px-6 py-3">
            {item.occurredThisMonth ? (
              <CheckCircle2 className="size-4 text-green-500 shrink-0" />
            ) : (
              <Clock className="size-4 text-yellow-500 shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.description || t("noDescription")}</p>
              <p className="text-xs text-muted-foreground">
                {TYPE_LABELS[item.type]}
                {item.categoryName && ` · ${item.categoryName}`}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className={`text-sm font-semibold tabular-nums ${
                item.type === "expense" || item.type === "saving"
                  ? "text-red-500"
                  : "text-green-500"
              }`}>
                {item.type === "income" ? "+" : "−"}{fmt(item.amount)}
              </p>
              <p className={`text-xs ${item.occurredThisMonth ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                {item.occurredThisMonth ? t("executed") : t("pending")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
