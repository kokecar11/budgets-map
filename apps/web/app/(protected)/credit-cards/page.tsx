import { auth } from "@/auth"
import { creditCardApi, creditCardPeriodApi } from "@/features/credit-cards/api"
import { CreditCardList } from "@/features/credit-cards/credit-card-list"
import type { CreditCardPeriod } from "@/features/credit-cards/types"

export default async function CreditCardsPage() {
  const session = await auth()
  const token = session?.accessToken ?? ""

  let cards: Awaited<ReturnType<typeof creditCardApi.list>> = []
  try {
    cards = await creditCardApi.list(token)
  } catch {
    // Token expirado o inválido — mostrar lista vacía
  }

  const periodsEntries = await Promise.allSettled(
    cards.map((card) => creditCardPeriodApi.list(card.id, token))
  )
  const periodsByCard: Record<string, CreditCardPeriod[]> = {}
  cards.forEach((card, i) => {
    const result = periodsEntries[i]
    periodsByCard[card.id] = result?.status === "fulfilled" ? result.value : []
  })

  return (
    <div className="p-6">
      <CreditCardList initialCards={cards} periodsByCard={periodsByCard} />
    </div>
  )
}
