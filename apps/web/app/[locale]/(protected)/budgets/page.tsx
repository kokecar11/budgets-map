import { auth } from "@/auth"
import { budgetApi } from "@/features/budgets/api"
import { BudgetList } from "@/features/budgets/budget-list"

export default async function BudgetsPage() {
  const session = await auth()
  let budgets: Awaited<ReturnType<typeof budgetApi.list>> = []
  try {
    budgets = await budgetApi.list(session?.accessToken ?? "")
  } catch {
    // Token expirado o inválido — mostrar lista vacía
  }

  return (
    <div className="p-6">
      <BudgetList initialBudgets={budgets} />
    </div>
  )
}
