export interface SavingGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline?: string | null
  status: "active" | "completed" | "cancelled"
  description?: string | null
  created_at?: string
  updated_at?: string
}

export interface SavingGoalCreate {
  name: string
  target_amount: number
  deadline?: string
  status?: "active" | "completed" | "cancelled"
  description?: string
}

export interface SavingGoalUpdate {
  name?: string
  target_amount?: number
  deadline?: string
  status?: "active" | "completed" | "cancelled"
  description?: string
}
