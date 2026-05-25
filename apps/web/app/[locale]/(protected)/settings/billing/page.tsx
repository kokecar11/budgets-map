"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { CheckCircle2, Crown, ExternalLink, Zap } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { subscriptionApi } from "@/features/subscription/api"

export default function BillingPage() {
  const { data: session } = useSession()
  const t = useTranslations("settings")
  const isPro = session?.user?.plan === "pro"
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [loadingPortal, setLoadingPortal] = useState(false)

  const PRO_FEATURES = [
    t("proFeature1"),
    t("proFeature2"),
    t("proFeature3"),
    t("proFeature4"),
    t("proFeature5"),
    t("proFeature6"),
  ]

  async function handleUpgrade() {
    if (!session?.accessToken) return
    setLoadingCheckout(true)
    try {
      const { checkout_url } = await subscriptionApi.createCheckout(session.accessToken)
      window.location.href = checkout_url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorStartingPayment"))
      setLoadingCheckout(false)
    }
  }

  async function handleManage() {
    if (!session?.accessToken) return
    setLoadingPortal(true)
    try {
      const { portal_url } = await subscriptionApi.getPortal(session.accessToken)
      window.open(portal_url, "_blank")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorOpeningPortal"))
    } finally {
      setLoadingPortal(false)
    }
  }

  return (
    <>
      {/* ── Current plan ── */}
      <div>
        <h2 className="text-base font-semibold mb-4">{t("currentPlan")}</h2>
        <div className="rounded-xl border bg-card px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isPro ? (
              <Crown className="size-5 text-yellow-500" />
            ) : (
              <Zap className="size-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-semibold">
                {isPro ? "Pro" : "Free"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isPro ? t("planProDesc") : t("planFreeDesc")}
              </p>
            </div>
          </div>
          {isPro ? (
            <Button variant="outline" size="sm" onClick={handleManage} disabled={loadingPortal}>
              <ExternalLink className="size-4" />
              {loadingPortal ? t("openingPortal") : t("managePlan")}
            </Button>
          ) : (
            <Button size="sm" onClick={handleUpgrade} disabled={loadingCheckout}>
              {loadingCheckout ? t("redirecting") : t("upgradeToPro")}
            </Button>
          )}
        </div>
      </div>

      {/* ── Pro Plan ── */}
      {!isPro && (
        <div>
          <h2 className="text-base font-semibold mb-4">{t("proPlanTitle")}</h2>
          <div className="rounded-xl border bg-card px-6 py-5">
            <ul className="flex flex-col gap-3">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-5 pt-4 border-t flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold">$7</span>
                <span className="text-muted-foreground text-sm"> {t("usdPerMonth")}</span>
              </div>
              <Button onClick={handleUpgrade} disabled={loadingCheckout}>
                {loadingCheckout ? t("redirecting") : t("startNow")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
