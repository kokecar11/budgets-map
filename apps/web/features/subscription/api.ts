import { apiFetch } from "@/lib/api"
import type { SubscriptionStatus } from "./types"

export const subscriptionApi = {
  status: (token: string) =>
    apiFetch<SubscriptionStatus>("/api/v1/subscription/status", { token }),

  createCheckout: (token: string) =>
    apiFetch<{ checkout_url: string }>("/api/v1/subscription/checkout", {
      method: "POST",
      token,
    }),

  getPortal: (token: string) =>
    apiFetch<{ portal_url: string }>("/api/v1/subscription/portal", { token }),
}
