import { apiFetch } from "@/lib/api"
import type {
  CreditCard, CreditCardCreate, CreditCardUpdate,
  CreditCardPeriod, CreditCardPeriodCreate,
  CreditCardTransaction, CreditCardTransactionCreate, CreditCardTransactionUpdate,
  CreditCardPayment, CreditCardPaymentCreate,
} from "./types"

export const creditCardApi = {
  list: (token: string) =>
    apiFetch<CreditCard[]>("/api/v1/credit-cards", { token }),

  get: (id: string, token: string) =>
    apiFetch<CreditCard>(`/api/v1/credit-cards/${id}`, { token }),

  create: (data: CreditCardCreate, token: string) =>
    apiFetch<CreditCard>("/api/v1/credit-cards", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  update: (id: string, data: CreditCardUpdate, token: string) =>
    apiFetch<CreditCard>(`/api/v1/credit-cards/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  delete: (id: string, token: string) =>
    apiFetch<void>(`/api/v1/credit-cards/${id}`, {
      method: "DELETE",
      token,
    }),
}

export const creditCardPeriodApi = {
  list: (creditCardId: string, token: string) =>
    apiFetch<CreditCardPeriod[]>(`/api/v1/credit-cards/${creditCardId}/periods`, { token }),

  create: (data: CreditCardPeriodCreate, token: string) =>
    apiFetch<CreditCardPeriod>(`/api/v1/credit-cards/${data.credit_card_id}/periods`, {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),
}

export const creditCardTransactionApi = {
  list: (creditCardId: string, token: string) =>
    apiFetch<CreditCardTransaction[]>(`/api/v1/credit-cards/${creditCardId}/transactions`, { token }),

  create: (creditCardId: string, data: CreditCardTransactionCreate, token: string) =>
    apiFetch<CreditCardTransaction>(`/api/v1/credit-cards/${creditCardId}/transactions`, {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  migrate: (creditCardId: string, token: string) =>
    apiFetch<{ count: number }>(`/api/v1/credit-cards/${creditCardId}/transactions/migrate`, {
      method: "POST",
      token,
    }),

  update: (id: string, data: CreditCardTransactionUpdate, token: string) =>
    apiFetch<CreditCardTransaction>(`/api/v1/credit-cards/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  delete: (id: string, token: string) =>
    apiFetch<void>(`/api/v1/credit-cards/transactions/${id}`, {
      method: "DELETE",
      token,
    }),
}

export const creditCardPaymentApi = {
  list: (creditCardId: string, token: string) =>
    apiFetch<CreditCardPayment[]>(`/api/v1/credit-cards/${creditCardId}/payments`, { token }),

  create: (data: CreditCardPaymentCreate, token: string) =>
    apiFetch<CreditCardPayment>(`/api/v1/credit-cards/${data.credit_card_id}/payments`, {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),
}
