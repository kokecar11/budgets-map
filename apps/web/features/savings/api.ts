import { apiFetch } from "@/lib/api"
import type { SavingGoal, SavingGoalCreate, SavingGoalUpdate } from "./types"

export const savingGoalApi = {
  list: (token: string) =>
    apiFetch<SavingGoal[]>("/api/v1/saving-goals", { token }),

  get: (id: string, token: string) =>
    apiFetch<SavingGoal>(`/api/v1/saving-goals/${id}`, { token }),

  create: (data: SavingGoalCreate, token: string) =>
    apiFetch<SavingGoal>("/api/v1/saving-goals", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  update: (id: string, data: SavingGoalUpdate, token: string) =>
    apiFetch<SavingGoal>(`/api/v1/saving-goals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  delete: (id: string, token: string) =>
    apiFetch<void>(`/api/v1/saving-goals/${id}`, {
      method: "DELETE",
      token,
    }),
}
