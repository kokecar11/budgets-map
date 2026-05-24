import { auth } from "@/auth"
import { loanApi } from "@/features/loans/api"
import { LoanList } from "@/features/loans/loan-list"

export default async function LoansPage() {
  const session = await auth()
  let loans: Awaited<ReturnType<typeof loanApi.list>> = []
  try {
    loans = await loanApi.list(session?.accessToken ?? "")
  } catch {
    // Token expirado o inválido — mostrar lista vacía
  }

  return (
    <div className="p-6">
      <LoanList initialLoans={loans} />
    </div>
  )
}
