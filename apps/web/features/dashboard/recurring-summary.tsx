"use client"

import { useMemo } from "react"
import { RefreshCw, CheckCircle2, Clock } from "lucide-react"
import type { Transaction } from "@/features/transactions/types"
import type { Category } from "@/features/categories/types"
import { parseDateParts } from "@/lib/dates"

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

const TYPE_LABELS: Record<Transaction["type"], string> = {
  income: "Ingreso",
  expense: "Gasto",
  transfer: "Transferencia",
  saving: "Ahorro",
}

const fmt = (n: number) =>
  `$ ${n.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`

export function RecurringSummary({
  transactions,
  categories,
  currentMonth,
  currentYear,
}: RecurringSummaryProps) {
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
      .map(([key, t]) => ({
        key,
        description: t.description ?? "Sin descripción",
        type: t.type,
        amount: t.amount,
        categoryName: t.category_id ? (categoryMap[t.category_id] ?? null) : null,
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
            <p className="font-semibold">Recurrentes del mes</p>
            <p className="text-xs text-muted-foreground">
              {occurred.length} ejecutados · {pending.length} pendientes
              {totalPending > 0 && ` · ${fmt(totalPending)} por salir`}
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
              <p className="text-sm font-medium truncate">{item.description}</p>
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
                {item.occurredThisMonth ? "Ejecutado" : "Pendiente"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
