import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  CreditCard,
  Globe,
  PiggyBank,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export const metadata: Metadata = {
  title: "Budgets Map",
  description:
    "Unlock the potential of your financial future with our powerful financial management tools. Take control, set your course, and shape your own path to success.",
}

const FEATURES = [
  {
    icon: Wallet,
    title: "Transacciones",
    description:
      "Registra ingresos, gastos, transferencias y ahorros. Filtra por cuenta, categoría o tipo al instante.",
  },
  {
    icon: Globe,
    title: "Cuentas y categorías",
    description:
      "Organiza tu dinero en múltiples cuentas. Crea categorías personalizadas con iconos para cada tipo de gasto.",
  },
  {
    icon: BarChart3,
    title: "Presupuestos",
    description:
      "Define límites de gasto por categoría. Recibe alertas al llegar al 80 % y 100 % de tu presupuesto.",
  },
  {
    icon: PiggyBank,
    title: "Metas de ahorro",
    description:
      "Crea objetivos financieros y vincula tus ahorros para ver el progreso hacia cada meta.",
  },
  {
    icon: CreditCard,
    title: "Tarjetas de crédito",
    description:
      "Registra tus tarjetas, controla los períodos de corte y lleva un historial de pagos y saldos.",
  },
  {
    icon: RefreshCw,
    title: "Transacciones recurrentes",
    description:
      "Automatiza pagos semanales o mensuales. El sistema genera la transacción por ti sin que lo olvides.",
  },
]

const PRO_HIGHLIGHTS = [
  { icon: BarChart3, label: "Reportes financieros con gráficas interactivas" },
  { icon: TrendingUp, label: "Patrimonio neto: activos vs pasivos en tiempo real" },
  { icon: ShieldCheck, label: "Exportar a CSV y PDF" },
  { icon: RefreshCw, label: "Transacciones recurrentes ilimitadas" },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <span className="font-bold text-lg text-primary">Budgets Map</span>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pricing">Precios</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/login">Comenzar gratis</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 flex flex-col gap-24 py-20">

        {/* Hero */}
        <section className="text-center flex flex-col items-center gap-6">
          <h1 className="text-5xl font-extrabold text-primary sm:text-7xl leading-tight">
            Master your finances <br />
            <span className="bg-gradient-to-r from-sky-500 via-emerald-500 to-sky-500 bg-clip-text text-transparent">
              & Design your own destiny
            </span>
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Unlock the potential of your financial future with our powerful
            financial management tools. Take control, set your course, and shape
            your own path to success.
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Button size="lg" asChild>
              <Link href="/login">
                Comenzar gratis <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">Ver planes</Link>
            </Button>
          </div>
        </section>

        {/* Features grid */}
        <section className="flex flex-col gap-10">
          <div className="text-center">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">Funcionalidades</p>
            <h2 className="text-3xl font-bold tracking-tight">Todo lo que necesitas, en un solo lugar</h2>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              Desde el primer gasto hasta tu balance anual — Budgets Map lo cubre todo.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-xl border bg-card p-6 flex flex-col gap-3">
                <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pro CTA */}
        <section className="rounded-2xl border-2 border-primary/30 bg-primary/5 px-8 py-12 flex flex-col items-center gap-8 text-center">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest">Plan Pro</p>
            <h2 className="text-3xl font-bold tracking-tight">Entiende tu dinero, no solo lo registres</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Con Pro obtienes reportes automáticos, gráficas avanzadas y el seguimiento de tu patrimonio neto.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
            {PRO_HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm bg-background rounded-lg border px-4 py-3">
                <Icon className="size-4 text-primary shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <Button size="lg" asChild>
            <Link href="/pricing">
              Ver planes y precios <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </section>

        {/* Final CTA */}
        <section className="text-center flex flex-col items-center gap-5 pb-8">
          <h2 className="text-3xl font-bold">Empieza gratis hoy</h2>
          <p className="text-muted-foreground max-w-sm">
            Sin tarjeta de crédito. Sin límite de transacciones. Registrate en segundos.
          </p>
          <Button size="lg" asChild>
            <Link href="/login">
              Crear cuenta gratis <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </section>

      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Budgets Map ·{" "}
        <Link href="/pricing" className="underline underline-offset-2 hover:text-foreground">Precios</Link>
        {" · "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacidad</Link>
        {" · "}
        <Link href="/login" className="underline underline-offset-2 hover:text-foreground">Iniciar sesión</Link>
      </footer>
    </div>
  )
}
