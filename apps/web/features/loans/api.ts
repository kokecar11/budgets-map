import { apiFetch } from "@/lib/api"
import type { Loan, LoanCreate, LoanUpdate, LoanPayment, LoanPaymentCreate, LoanAmortization } from "./types"

export const loanApi = {
  list: (token: string) =>
    apiFetch<Loan[]>("/api/v1/loans/", { token }),

  get: (id: string, token: string) =>
    apiFetch<Loan>(`/api/v1/loans/${id}`, { token }),

  create: (data: LoanCreate, token: string) =>
    apiFetch<Loan>("/api/v1/loans/", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  update: (id: string, data: LoanUpdate, token: string) =>
    apiFetch<Loan>(`/api/v1/loans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  delete: (id: string, token: string) =>
    apiFetch<void>(`/api/v1/loans/${id}`, {
      method: "DELETE",
      token,
    }),
}

export const loanPaymentApi = {
  list: (loanId: string, token: string) =>
    apiFetch<LoanPayment[]>(`/api/v1/loans/${loanId}/payments`, { token }),

  create: (loanId: string, data: LoanPaymentCreate, token: string) =>
    apiFetch<LoanPayment>(`/api/v1/loans/${loanId}/payments`, {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  delete: (id: string, token: string) =>
    apiFetch<void>(`/api/v1/loans/payments/${id}`, {
      method: "DELETE",
      token,
    }),
}

export const loanAmortizationApi = {
  list: (loanId: string, token: string) =>
    apiFetch<LoanAmortization[]>(`/api/v1/loans/${loanId}/amortization`, { token }),
}
