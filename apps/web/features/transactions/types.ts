export interface Transaction {
  id: string
  user_id: string
  account_id: string
  type: "income" | "expense" | "transfer" | "saving"
  amount: number
  date: string
  category_id?: string | null
  description?: string | null
  is_recurring: boolean
  recurrence?: "none" | "weekly" | "monthly" | null
  transfer_to_account_id?: string | null
  saving_goal_id?: string | null
  recurrence_day_of_month?: number | null
  parent_transaction_id?: string | null
  created_at?: string
  updated_at?: string
}

export interface TransactionPage {
  items: Transaction[]
  next_token: string | null
}

export interface TransactionCreate {
  account_id: string
  type: "income" | "expense" | "transfer" | "saving"
  amount: number
  date: string
  category_id?: string
  description?: string
  is_recurring?: boolean
  recurrence?: "none" | "weekly" | "monthly"
  transfer_to_account_id?: string
  saving_goal_id?: string
  loan_payment_id?: string
  credit_card_payment_id?: string
}

export interface TransactionUpdate {
  category_id?: string
  type?: "income" | "expense" | "transfer" | "saving"
  amount?: number
  description?: string
  date?: string
  is_recurring?: boolean
  recurrence?: "none" | "weekly" | "monthly"
}
