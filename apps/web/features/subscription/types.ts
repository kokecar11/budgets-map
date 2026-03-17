export interface SubscriptionStatus {
  plan: "free" | "pro"
  subscription_status: string | null
  subscription_ends_at: string | null
  lemon_squeezy_customer_id: string | null
}
