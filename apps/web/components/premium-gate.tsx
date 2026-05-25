"use client"

import { Lock } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { useRouter } from "@/i18n/navigation"

interface PremiumGateProps {
  children: React.ReactNode
  isPro: boolean
  featureName?: string
}

export function PremiumGate({ children, isPro, featureName }: PremiumGateProps) {
  const router = useRouter()
  const t = useTranslations("premiumGate")

  if (isPro) return <>{children}</>

  return (
    <div className="relative rounded-xl border bg-card overflow-hidden">
      <div className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/60 backdrop-blur-[2px]">
        <div className="flex items-center justify-center size-12 rounded-full bg-primary/10">
          <Lock className="size-5 text-primary" />
        </div>
        <div className="text-center px-6">
          <p className="font-semibold text-base">{t("title")}</p>
          {featureName && (
            <p className="text-sm text-muted-foreground mt-1">
              {t("description", { featureName })}
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => router.push("/pricing")}>
          {t("viewPlans")}
        </Button>
      </div>
    </div>
  )
}
