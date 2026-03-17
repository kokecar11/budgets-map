import { auth } from "@/auth"
import { accountApi } from "@/features/accounts/api"
import { savingGoalApi } from "@/features/savings/api"
import { loanApi } from "@/features/loans/api"
import { creditCardApi, creditCardPeriodApi } from "@/features/credit-cards/api"
import type { CreditCardPeriod } from "@/features/credit-cards/types"
import { NetWorthContent } from "@/features/net-worth/net-worth-content"

export default async function NetWorthPage() {
  const session = await auth()
  const token = session?.accessToken ?? ""

  const [accounts, savingGoals, loans, creditCards] = await Promise.allSettled([
    accountApi.list(token),
    savingGoalApi.list(token),
    loanApi.list(token),
    creditCardApi.list(token),
  ])

  // Fetch periods for each credit card to get current debt
  const cards = creditCards.status === "fulfilled" ? creditCards.value : []
  const periodsEntries = await Promise.allSettled(
    cards.map((card) => creditCardPeriodApi.list(card.id, token))
  )
  const creditCardPeriods: Record<string, CreditCardPeriod[]> = {}
  cards.forEach((card, i) => {
    const result = periodsEntries[i]
    creditCardPeriods[card.id] = result?.status === "fulfilled" ? result.value : []
  })

  return (
    <NetWorthContent
      isPro={session?.user?.plan === "pro"}
      accounts={accounts.status === "fulfilled" ? accounts.value : []}
      savingGoals={savingGoals.status === "fulfilled" ? savingGoals.value : []}
      loans={loans.status === "fulfilled" ? loans.value : []}
      creditCards={cards}
      creditCardPeriods={creditCardPeriods}
    />
  )
}
