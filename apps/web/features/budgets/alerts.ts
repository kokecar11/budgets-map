import type { BudgetItem } from "./types"

export interface BudgetAlert {
  itemId: string
  level: "warning" | "danger"
  categoryId: string | null
  description: string
  spent: number
  planned: number
  pct: number
}

/**
 * Pure helper: derives over-threshold budget alerts from budget items.
 * Category-name resolution is left to the caller (renderers resolve from their
 * own categories list); this keeps the helper free of a categories dependency
 * so callers that only need the count (e.g. the protected layout) stay light.
 */
export function computeBudgetAlerts(
  items: BudgetItem[],
  warningPct = 80,
  dangerPct = 100,
): BudgetAlert[] {
  const result: BudgetAlert[] = []
  for (const item of items) {
    if (item.planned_amount <= 0) continue
    const spent = item.actual_amount ?? (item.is_paid ? item.planned_amount : 0)
    if (spent <= 0) continue
    const pct = (spent / item.planned_amount) * 100
    if (pct < warningPct) continue
    result.push({
      itemId: item.id,
      level: pct >= dangerPct ? "danger" : "warning",
      categoryId: item.category_id ?? null,
      description: item.description,
      spent,
      planned: item.planned_amount,
      pct,
    })
  }
  return result.sort((a, b) => b.pct - a.pct)
}
