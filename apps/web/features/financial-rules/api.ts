import { apiFetch } from "@/lib/api"
import type { FinancialRules, FinancialRulesUpdate } from "./types"

export const financialRulesApi = {
  get: (token: string) =>
    apiFetch<FinancialRules>("/api/v1/financial-rules", { token }),

  update: (data: FinancialRulesUpdate, token: string) =>
    apiFetch<FinancialRules>("/api/v1/financial-rules", {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),
}
