import { apiFetch } from "@/lib/api"
import type { Category, CategoryCreate, CategoryUpdate } from "./types"

export const categoryApi = {
  list: (token: string) =>
    apiFetch<Category[]>("/api/v1/categories/", { token }),

  get: (id: string, token: string) =>
    apiFetch<Category>(`/api/v1/categories/${id}`, { token }),

  create: (data: CategoryCreate, token: string) =>
    apiFetch<Category>("/api/v1/categories/", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  update: (id: string, data: CategoryUpdate, token: string) =>
    apiFetch<Category>(`/api/v1/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  delete: (id: string, token: string) =>
    apiFetch<void>(`/api/v1/categories/${id}`, {
      method: "DELETE",
      token,
    }),
}
