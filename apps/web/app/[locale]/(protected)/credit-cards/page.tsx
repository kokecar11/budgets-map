import { auth } from "@/auth"
import { creditCardApi, creditCardPeriodApi, creditCardTransactionApi, creditCardPaymentApi } from "@/features/credit-cards/api"
import { CreditCardList } from "@/features/credit-cards/credit-card-list"
import type { CreditCardPeriod, CreditCardTransaction, CreditCardPayment } from "@/features/credit-cards/types"

export default async function CreditCardsPage() {
  const session = await auth()
  const token = session?.accessToken ?? ""

  let cards: Awaited<ReturnType<typeof creditCardApi.list>> = []
  try {
    cards = await creditCardApi.list(token)
  } catch {
    // Token expirado o inválido — mostrar lista vacía
  }

  const [periodsEntries, chargesEntries, paymentsEntries] = await Promise.all([
    Promise.allSettled(cards.map((card) => creditCardPeriodApi.list(card.id, token))),
    Promise.allSettled(cards.map((card) => creditCardTransactionApi.list(card.id, token))),
    Promise.allSettled(cards.map((card) => creditCardPaymentApi.list(card.id, token))),
  ])

  const periodsByCard: Record<string, CreditCardPeriod[]> = {}
  const chargesByCard: Record<string, CreditCardTransaction[]> = {}
  const paymentsByCard: Record<string, CreditCardPayment[]> = {}

  cards.forEach((card, i) => {
    periodsByCard[card.id] = periodsEntries[i]?.status === "fulfilled" ? periodsEntries[i].value : []
    chargesByCard[card.id] = chargesEntries[i]?.status === "fulfilled" ? chargesEntries[i].value : []
    paymentsByCard[card.id] = paymentsEntries[i]?.status === "fulfilled" ? paymentsEntries[i].value : []
  })

  return (
    <div className="p-6">
      <CreditCardList
        initialCards={cards}
        periodsByCard={periodsByCard}
        chargesByCard={chargesByCard}
        paymentsByCard={paymentsByCard}
      />
    </div>
  )
}
