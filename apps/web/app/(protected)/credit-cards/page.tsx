import { auth } from "@/auth"
import { creditCardApi } from "@/features/credit-cards/api"
import { CreditCardList } from "@/features/credit-cards/credit-card-list"

export default async function CreditCardsPage() {
  const session = await auth()
  let cards: Awaited<ReturnType<typeof creditCardApi.list>> = []
  try {
    cards = await creditCardApi.list(session?.accessToken ?? "")
  } catch {
    // Token expirado o inválido — mostrar lista vacía
  }

  return (
    <div className="p-6">
      <CreditCardList initialCards={cards} />
    </div>
  )
}
