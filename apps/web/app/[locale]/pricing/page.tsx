import Link from "next/link"
import { Check, Zap, Crown } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

const FREE_FEATURES = [
  "Transacciones ilimitadas",
  "Cuentas y categorías personalizadas",
  "Metas de ahorro",
  "Préstamos y tarjetas de crédito",
  "Presupuesto mensual",
  "Dashboard básico",
  "1 transacción recurrente",
]

const PRO_FEATURES = [
  "Todo lo del plan Free",
  "Transacciones recurrentes ilimitadas",
  "Reportes financieros (gráficas de ingresos, gastos y tendencias)",
  "Patrimonio neto: activos vs pasivos en tiempo real",
  "Alertas de presupuesto (80% y 100%)",
  "Exportar CSV y PDF",
  "Historial ilimitado de presupuestos",
  "Gráficas de tendencias avanzadas",
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="font-bold text-lg text-primary">Budgets Map</Link>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/login">Comenzar gratis</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 flex flex-col items-center gap-12">
        {/* Hero */}
        <div className="text-center flex flex-col gap-3">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest">Planes</p>
          <h1 className="text-4xl font-bold tracking-tight">Gratis para registrar.<br />Pro para entender.</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Registra tus finanzas sin costo. Desbloquea reportes automáticos, alertas y más con Pro.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

          {/* Free */}
          <div className="rounded-2xl border bg-card px-8 py-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-muted">
                <Zap className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-bold text-lg">Free</p>
                <p className="text-muted-foreground text-sm">Para siempre</p>
              </div>
            </div>
            <div>
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground ml-1">/ mes</span>
            </div>
            <ul className="flex flex-col gap-3 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Check className="size-4 text-green-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Comenzar gratis</Link>
            </Button>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border-2 border-primary bg-card px-8 py-8 flex flex-col gap-6 relative overflow-hidden">
            <div
              className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary text-primary-foreground"
            >
              Popular
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
                <Crown className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-lg">Pro</p>
                <p className="text-muted-foreground text-sm">Resultados continuos</p>
              </div>
            </div>
            <div>
              <span className="text-4xl font-bold">$7</span>
              <span className="text-muted-foreground ml-1">USD / mes</span>
            </div>
            <ul className="flex flex-col gap-3 flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Check className="size-4 text-primary mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button className="w-full" asChild>
              <Link href="/settings/billing">Empezar con Pro</Link>
            </Button>
          </div>

        </div>

        {/* FAQ */}
        <div className="w-full max-w-2xl flex flex-col gap-4">
          <h2 className="text-xl font-bold text-center">Preguntas frecuentes</h2>
          <div className="divide-y rounded-xl border bg-card overflow-hidden">
            {[
              {
                q: "¿Puedo cancelar cuando quiera?",
                a: "Sí. Cancelas desde el portal de cliente y tu plan sigue activo hasta el final del período pagado.",
              },
              {
                q: "¿Cómo se procesan los pagos?",
                a: "Usamos LemonSqueezy, que maneja impuestos y facturación. Puedes pagar con tarjeta de crédito o débito.",
              },
              {
                q: "¿Mis datos están seguros si bajo a Free?",
                a: "Sí. Tus datos se conservan. Solo pierdes acceso a las funciones Pro, no a tu historial.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="px-6 py-4">
                <p className="font-medium text-sm">{q}</p>
                <p className="text-sm text-muted-foreground mt-1">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Budgets Map ·{" "}
        <Link href="/" className="underline underline-offset-2 hover:text-foreground">Inicio</Link>
        {" · "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacidad</Link>
        {" · "}
        <Link href="/login" className="underline underline-offset-2 hover:text-foreground">Iniciar sesión</Link>
      </footer>
    </div>
  )
}
