import { auth } from "@/auth"
import { creditCardApi, creditCardTransactionApi, creditCardPaymentApi, creditCardPeriodApi } from "@/features/credit-cards/api"
import { accountApi } from "@/features/accounts/api"
import { categoryApi } from "@/features/categories/api"
import { CreditCardDetail } from "@/features/credit-cards/credit-card-detail"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

export default async function CreditCardDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  const token = session?.accessToken ?? ""

  let card
  try {
    card = await creditCardApi.get(id, token)
  } catch {
    notFound()
  }

  const [charges, payments, periods, accounts, categories] = await Promise.allSettled([
    creditCardTransactionApi.list(id, token),
    creditCardPaymentApi.list(id, token),
    creditCardPeriodApi.list(id, token),
    accountApi.list(token),
    categoryApi.list(token),
  ])

  return (
    <div className="p-6">
      <CreditCardDetail
        card={card}
        initialCharges={charges.status === "fulfilled" ? charges.value : []}
        initialPayments={payments.status === "fulfilled" ? payments.value : []}
        periods={periods.status === "fulfilled" ? periods.value : []}
        accounts={accounts.status === "fulfilled" ? accounts.value : []}
        categories={categories.status === "fulfilled" ? categories.value : []}
      />
    </div>
  )
}
