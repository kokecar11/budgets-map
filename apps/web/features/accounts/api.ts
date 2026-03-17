import { apiFetch } from "@/lib/api"
import type { Account, AccountCreate, AccountUpdate } from "./types"

export const accountApi = {
  list: (token: string) =>
    apiFetch<Account[]>("/api/v1/accounts/", { token }),

  get: (id: string, token: string) =>
    apiFetch<Account>(`/api/v1/accounts/${id}`, { token }),

  create: (data: AccountCreate, token: string) =>
    apiFetch<Account>("/api/v1/accounts/", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  update: (id: string, data: AccountUpdate, token: string) =>
    apiFetch<Account>(`/api/v1/accounts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  delete: (id: string, token: string) =>
    apiFetch<void>(`/api/v1/accounts/${id}`, {
      method: "DELETE",
      token,
    }),
}
