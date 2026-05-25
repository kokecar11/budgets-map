import { apiFetch } from "@/lib/api"
import type { Budget, BudgetCreate, BudgetUpdate, BudgetItem, BudgetItemCreate, BudgetItemUpdate, BudgetSummary } from "./types"

export const budgetApi = {
  list: (token: string) =>
    apiFetch<Budget[]>("/api/v1/budgets", { token }),

  get: (id: string, token: string) =>
    apiFetch<Budget>(`/api/v1/budgets/${id}`, { token }),

  create: (data: BudgetCreate, token: string) =>
    apiFetch<Budget>("/api/v1/budgets", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  update: (id: string, data: BudgetUpdate, token: string) =>
    apiFetch<Budget>(`/api/v1/budgets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  delete: (id: string, token: string) =>
    apiFetch<void>(`/api/v1/budgets/${id}`, {
      method: "DELETE",
      token,
    }),

  summary: (id: string, token: string) =>
    apiFetch<BudgetSummary>(`/api/v1/budgets/${id}/summary`, { token }),
}

export const budgetItemApi = {
  list: (budgetId: string, token: string) =>
    apiFetch<BudgetItem[]>(`/api/v1/budgets/${budgetId}/items`, { token }),

  create: (budgetId: string, data: BudgetItemCreate, token: string) =>
    apiFetch<BudgetItem>(`/api/v1/budgets/${budgetId}/items`, {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  update: (id: string, data: BudgetItemUpdate, token: string) =>
    apiFetch<BudgetItem>(`/api/v1/budgets/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  delete: (id: string, token: string) =>
    apiFetch<void>(`/api/v1/budgets/items/${id}`, {
      method: "DELETE",
      token,
    }),
}
