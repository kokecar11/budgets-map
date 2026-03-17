export interface Loan {
  id: string
  user_id: string
  name: string
  lender: string
  principal: number
  balance: number
  interest_rate: number
  monthly_payment: number
  start_date: string
  end_date: string
  payment_day: number
  status: "active" | "paid" | "defaulted"
  created_at?: string
  updated_at?: string
}

export interface LoanCreate {
  name: string
  lender: string
  principal: number
  balance: number
  interest_rate: number
  monthly_payment: number
  start_date: string
  end_date: string
  payment_day: number
  status?: "active" | "paid" | "defaulted"
}

export interface LoanUpdate {
  name?: string
  lender?: string
  balance?: number
  interest_rate?: number
  monthly_payment?: number
  end_date?: string
  payment_day?: number
  status?: "active" | "paid" | "defaulted"
}

export interface LoanPayment {
  id: string
  loan_id: string
  amount: number
  principal_paid: number
  interest_paid: number
  date: string
  period: string
  created_at?: string
  updated_at?: string
}

export interface LoanPaymentCreate {
  amount: number
  principal_paid: number
  interest_paid: number
  date: string
  period: string
}
