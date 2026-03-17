"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { CheckCircle2, Crown, ExternalLink, Zap } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { subscriptionApi } from "@/features/subscription/api"

const PRO_FEATURES = [
  "Transacciones recurrentes automáticas",
  "Alertas de presupuesto (80% y 100%)",
  "Reporte semanal por email",
  "Exportar CSV y PDF",
  "Historial ilimitado de presupuestos",
  "Gráficas de tendencias avanzadas",
]

export default function BillingPage() {
  const { data: session } = useSession()
  const isPro = session?.user?.plan === "pro"
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [loadingPortal, setLoadingPortal] = useState(false)

  async function handleUpgrade() {
    if (!session?.accessToken) return
    setLoadingCheckout(true)
    try {
      const { checkout_url } = await subscriptionApi.createCheckout(session.accessToken)
      window.location.href = checkout_url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al iniciar el pago")
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
      toast.error(err instanceof Error ? err.message : "Error al abrir el portal")
    } finally {
      setLoadingPortal(false)
    }
  }

  return (
    <>
      {/* ── Plan actual ── */}
      <div>
        <h2 className="text-base font-semibold mb-4">Plan actual</h2>
        <div className="rounded-xl border bg-card px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isPro ? (
              <Crown className="size-5 text-yellow-500" />
            ) : (
              <Zap className="size-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-semibold">
                Plan: <span className={isPro ? "text-yellow-500" : ""}>{isPro ? "Pro" : "Free"}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {isPro
                  ? "Tienes acceso a todas las funciones premium."
                  : "Actualiza para desbloquear reportes, alertas y más."}
              </p>
            </div>
          </div>
          {isPro ? (
            <Button variant="outline" size="sm" onClick={handleManage} disabled={loadingPortal}>
              <ExternalLink className="size-4" />
              {loadingPortal ? "Abriendo..." : "Administrar"}
            </Button>
          ) : (
            <Button size="sm" onClick={handleUpgrade} disabled={loadingCheckout}>
              {loadingCheckout ? "Redirigiendo..." : "Actualizar a Pro"}
            </Button>
          )}
        </div>
      </div>

      {/* ── Plan Pro ── */}
      {!isPro && (
        <div>
          <h2 className="text-base font-semibold mb-4">Plan Pro</h2>
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
                <span className="text-muted-foreground text-sm"> USD / mes</span>
              </div>
              <Button onClick={handleUpgrade} disabled={loadingCheckout}>
                {loadingCheckout ? "Redirigiendo..." : "Empezar ahora"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
