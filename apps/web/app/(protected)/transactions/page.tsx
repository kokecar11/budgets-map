import { auth } from "@/auth"
import { transactionApi } from "@/features/transactions/api"
import { accountApi } from "@/features/accounts/api"
import { categoryApi } from "@/features/categories/api"
import { savingGoalApi } from "@/features/savings/api"
import { loanApi } from "@/features/loans/api"
import { TransactionList } from "@/features/transactions/transaction-list"

export default async function TransactionsPage() {
  const session = await auth()
  const token = session?.accessToken ?? ""

  const [firstPage, accounts, categories, savingGoals, loans] = await Promise.allSettled([
    transactionApi.listPage(token, { limit: 50 }),
    accountApi.list(token),
    categoryApi.list(token),
    savingGoalApi.list(token),
    loanApi.list(token),
  ])

  const initialPage = firstPage.status === "fulfilled" ? firstPage.value : { items: [], next_token: null }

  return (
    <div className="p-6">
      <TransactionList
        token={token}
        isPro={session?.user?.plan === "pro"}
        userName={session?.user?.name ?? ""}
        userEmail={session?.user?.email ?? ""}
        initialTransactions={initialPage.items}
        initialNextToken={initialPage.next_token}
        accounts={accounts.status === "fulfilled" ? accounts.value : []}
        categories={categories.status === "fulfilled" ? categories.value : []}
        savingGoals={savingGoals.status === "fulfilled" ? savingGoals.value : []}
        loans={loans.status === "fulfilled" ? loans.value : []}
      />
    </div>
  )
}
