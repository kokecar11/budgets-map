export type ExpenseModel = "accrual" | "cash"

export interface FinancialRules {
  id: string
  user_id: string
  expense_model: ExpenseModel
  created_at?: string
  updated_at?: string
}

export interface FinancialRulesUpdate {
  expense_model?: ExpenseModel
}
