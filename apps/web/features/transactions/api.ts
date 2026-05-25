import { apiFetch } from "@/lib/api"
import type { Transaction, TransactionCreate, TransactionUpdate, TransactionPage } from "./types"

export const transactionApi = {
  list: (token: string) =>
    apiFetch<Transaction[]>("/api/v1/transactions", { token }),

  listPage: (token: string, params?: { limit?: number; next_token?: string }) => {
    const q = new URLSearchParams()
    if (params?.limit) q.set("limit", String(params.limit))
    if (params?.next_token) q.set("next_token", params.next_token)
    return apiFetch<TransactionPage>(`/api/v1/transactions/paged?${q}`, { token })
  },

  get: (id: string, token: string) =>
    apiFetch<Transaction>(`/api/v1/transactions/${id}`, { token }),

  create: (data: TransactionCreate, token: string) =>
    apiFetch<Transaction>("/api/v1/transactions", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  update: (id: string, data: TransactionUpdate, token: string) =>
    apiFetch<Transaction>(`/api/v1/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  delete: (id: string, token: string) =>
    apiFetch<void>(`/api/v1/transactions/${id}`, {
      method: "DELETE",
      token,
    }),
}
