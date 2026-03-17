"use client"

import { Lock } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useRouter } from "next/navigation"

interface PremiumGateProps {
  children: React.ReactNode
  isPro: boolean
  featureName?: string
}

export function PremiumGate({ children, isPro, featureName }: PremiumGateProps) {
  const router = useRouter()

  if (isPro) return <>{children}</>

  return (
    <div className="relative rounded-xl border bg-card overflow-hidden">
      {/* Blurred preview */}
      <div className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/60 backdrop-blur-[2px]">
        <div className="flex items-center justify-center size-12 rounded-full bg-primary/10">
          <Lock className="size-5 text-primary" />
        </div>
        <div className="text-center px-6">
          <p className="font-semibold text-base">Función Premium</p>
          {featureName && (
            <p className="text-sm text-muted-foreground mt-1">{featureName} está disponible en el plan Pro.</p>
          )}
        </div>
        <Button size="sm" onClick={() => router.push("/pricing")}>
          Ver planes
        </Button>
      </div>
    </div>
  )
}
