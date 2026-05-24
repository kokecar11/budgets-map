import { auth } from "@/auth"
import { transactionApi } from "@/features/transactions/api"
import { accountApi } from "@/features/accounts/api"
import { savingGoalApi } from "@/features/savings/api"
import { loanApi } from "@/features/loans/api"
import { categoryApi } from "@/features/categories/api"
import { budgetApi, budgetItemApi } from "@/features/budgets/api"
import type { BudgetItem } from "@/features/budgets/types"
import type { Budget } from "@/features/budgets/types"
import { DashboardContent } from "@/features/dashboard/dashboard-content"

export default async function DashboardPage() {
  const session = await auth()
  const token = session?.accessToken ?? ""

  const [transactions, accounts, savingGoals, loans, categories, budgets] =
    await Promise.allSettled([
      transactionApi.list(token),
      accountApi.list(token),
      savingGoalApi.list(token),
      loanApi.list(token),
      categoryApi.list(token),
      budgetApi.list(token),
    ])

  // Find current month's budget, then fetch its items
  const now = new Date()
  let currentBudget: Budget | undefined
  let budgetItems: BudgetItem[] = []

  if (budgets.status === "fulfilled") {
    currentBudget = budgets.value.find(
      (b) => b.month === now.getMonth() + 1 && b.year === now.getFullYear()
    )
    if (currentBudget) {
      try {
        budgetItems = await budgetItemApi.list(currentBudget.id, token)
      } catch {
        budgetItems = []
      }
    }
  }

  return (
    <DashboardContent
      isPro={session?.user?.plan === "pro"}
      transactions={transactions.status === "fulfilled" ? transactions.value : []}
      accounts={accounts.status === "fulfilled" ? accounts.value : []}
      savingGoals={savingGoals.status === "fulfilled" ? savingGoals.value : []}
      loans={loans.status === "fulfilled" ? loans.value : []}
      categories={categories.status === "fulfilled" ? categories.value : []}
      currentBudget={currentBudget}
      budgetItems={budgetItems}
    />
  )
}
