export interface Budget {
  id: string
  user_id: string
  name: string
  month: number
  year: number
  description?: string | null
  alert_warning_pct: number
  alert_danger_pct: number
  created_at?: string
  updated_at?: string
}

export interface BudgetCreate {
  name: string
  month: number
  year: number
  description?: string
}

export interface BudgetUpdate {
  name?: string
  month?: number
  year?: number
  description?: string
  alert_warning_pct?: number
  alert_danger_pct?: number
}

export interface BudgetItem {
  id: string
  budget_id: string
  description: string
  planned_amount: number
  is_paid: boolean
  category_id?: string | null
  transaction_id?: string | null
  created_at?: string
  updated_at?: string
}

export interface BudgetItemCreate {
  description: string
  planned_amount: number
  is_paid?: boolean
  category_id?: string
}

export interface BudgetItemUpdate {
  description?: string
  planned_amount?: number
  is_paid?: boolean
  category_id?: string
}
