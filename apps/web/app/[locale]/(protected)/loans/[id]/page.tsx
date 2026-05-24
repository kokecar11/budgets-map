import { auth } from "@/auth"
import { notFound } from "next/navigation"
import { loanApi, loanPaymentApi, loanAmortizationApi } from "@/features/loans/api"
import { LoanDetail } from "@/features/loans/loan-detail"

interface Props {
  params: Promise<{ id: string }>
}

export default async function LoanDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  const token = session?.accessToken ?? ""

  let loan
  try {
    loan = await loanApi.get(id, token)
  } catch {
    notFound()
  }

  const [payments, amortization] = await Promise.allSettled([
    loanPaymentApi.list(id, token),
    loanAmortizationApi.list(id, token),
  ])

  return (
    <div className="p-6">
      <LoanDetail
        loan={loan}
        payments={payments.status === "fulfilled" ? payments.value : []}
        amortization={amortization.status === "fulfilled" ? amortization.value : []}
      />
    </div>
  )
}
