import { apiFetch } from "@/lib/api"
import type { MonthlyStatsResponse, CategoryStatsResponse } from "./types"

export const reportsApi = {
  monthlyStats: (token: string, year: number) =>
    apiFetch<MonthlyStatsResponse>(`/api/v1/transactions/summary/monthly?year=${year}`, { token }),

  categoryStats: (token: string, year: number, month?: number) => {
    const q = new URLSearchParams({ year: String(year) })
    if (month) q.set("month", String(month))
    return apiFetch<CategoryStatsResponse>(`/api/v1/transactions/summary/categories?${q}`, { token })
  },
}
