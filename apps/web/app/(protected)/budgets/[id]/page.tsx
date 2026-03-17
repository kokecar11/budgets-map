import { auth } from "@/auth"
import { budgetApi, budgetItemApi } from "@/features/budgets/api"
import { categoryApi } from "@/features/categories/api"
import { BudgetItemsList } from "@/features/budgets/budget-items-list"
import { BudgetAlertSettings } from "@/features/budgets/budget-alert-settings"

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const token = session?.accessToken ?? ""

  const [budget, items, allBudgets, categories] = await Promise.all([
    budgetApi.get(id, token),
    budgetItemApi.list(id, token),
    budgetApi.list(token),
    categoryApi.list(token).catch(() => []),
  ])

  // Find previous month's budget
  const prevMonth = budget.month === 1 ? 12 : budget.month - 1
  const prevYear = budget.month === 1 ? budget.year - 1 : budget.year
  const previousBudget = allBudgets.find(
    (b) => b.month === prevMonth && b.year === prevYear
  )

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{budget.name}</h1>
        <p className="text-muted-foreground">
          {MONTHS[budget.month - 1]} {budget.year}
          {budget.description && ` · ${budget.description}`}
        </p>
      </div>
      <BudgetItemsList
        budgetId={id}
        initialItems={items}
        previousBudgetId={previousBudget?.id}
        categories={categories}
      />
      <BudgetAlertSettings budget={budget} />
    </div>
  )
}
