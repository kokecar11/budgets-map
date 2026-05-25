import { auth } from "@/auth"
import { savingGoalApi } from "@/features/savings/api"
import { SavingGoalList } from "@/features/savings/saving-goal-list"

export default async function SavingsPage() {
  const session = await auth()
  let goals: Awaited<ReturnType<typeof savingGoalApi.list>> = []
  try {
    goals = await savingGoalApi.list(session?.accessToken ?? "")
  } catch {
    // Token expirado o inválido — mostrar lista vacía
  }

  return (
    <div className="p-6">
      <SavingGoalList initialGoals={goals} />
    </div>
  )
}
