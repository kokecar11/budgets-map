export interface CreditCard {
  id: string
  user_id: string
  alias: string
  credit_limit: number
  cutoff_day: number
  payment_day: number
  interest_rate: number
  created_at?: string
  updated_at?: string
}

export interface CreditCardCreate {
  alias: string
  credit_limit: number
  cutoff_day: number
  payment_day: number
  interest_rate: number
}

export interface CreditCardUpdate {
  alias?: string
  credit_limit?: number
  cutoff_day?: number
  payment_day?: number
  interest_rate?: number
}

export interface CreditCardPeriod {
  id: string
  credit_card_id: string
  period_date: string
  opening_balance: number
  consumed: number
  minimum_payment: number
  total_payment: number
  closing_balance: number
  due_date: string
  created_at?: string
  updated_at?: string
}

export interface CreditCardTransaction {
  id: string
  credit_card_id: string
  category_id: string
  description: string
  amount: number
  date: string
  installments: number
  installment_number: number
  interest_rate?: number | null
  period_id?: string | null
  created_at?: string
  updated_at?: string
}

export interface CreditCardTransactionCreate {
  credit_card_id: string
  category_id: string
  description: string
  amount: number
  date: string
  installments?: number
  installment_number: number
  interest_rate?: number
  period_id?: string
}

export interface CreditCardPayment {
  id: string
  credit_card_id: string
  period_id: string
  amount: number
  type: "minimum" | "total" | "partial"
  date: string
  created_at?: string
  updated_at?: string
}

export interface CreditCardPaymentCreate {
  credit_card_id: string
  period_id: string
  amount: number
  type: "minimum" | "total" | "partial"
  date: string
}

export interface CreditCardPeriodCreate {
  credit_card_id: string
  period_date: string
  opening_balance: number
  consumed: number
  minimum_payment: number
  total_payment: number
  closing_balance: number
  due_date: string
}
