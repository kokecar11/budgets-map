"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Landmark, CalendarDays, Percent, CreditCard, ArrowLeft,
  Trash2, CheckCircle2, Clock, ChevronDown, ChevronUp,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Progress } from "@workspace/ui/components/progress"

import { loanApi } from "./api"
import type { Loan, LoanPayment, LoanAmortization } from "./types"

const STATUS_LABELS: Record<Loan["status"], string> = {
  active: "Activo",
  paid: "Pagado",
  defaulted: "En mora",
}

const STATUS_BADGE: Record<Loan["status"], string> = {
  active: "bg-green-600/10 text-green-600 border-green-600/20 dark:bg-green-500/10 dark:text-green-400",
  paid: "bg-blue-600/10 text-blue-600 border-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400",
  defaulted: "bg-red-600/10 text-red-600 border-red-600/20 dark:bg-red-500/10 dark:text-red-400",
}

const fmt = (n: number) =>
  `$ ${n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })

interface LoanDetailProps {
  loan: Loan
  payments: LoanPayment[]
  amortization: LoanAmortization[]
}

export function LoanDetail({ loan, payments, amortization }: LoanDetailProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [showAllAmortization, setShowAllAmortization] = useState(false)

  const paidAmount = loan.principal - loan.balance
  const pctPaid = loan.principal > 0
    ? Math.min(100, Math.round((paidAmount / loan.principal) * 100))
    : 0

  const totalInterestPaid = payments.reduce((s, p) => s + p.interest_paid, 0)
  const totalPrincipalPaid = payments.reduce((s, p) => s + p.principal_paid, 0)

  async function handleDelete() {
    if (!confirm("¿Eliminar este préstamo?")) return
    try {
      await loanApi.delete(loan.id, session?.accessToken ?? "")
      toast.success("Préstamo eliminado")
      router.push("/loans")
    } catch {
      toast.error("Error al eliminar el préstamo")
    }
  }

  const displayedAmortization = showAllAmortization ? amortization : amortization.slice(0, 12)

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              variant="ghost"
              className="size-9 text-muted-foreground"
              onClick={() => router.push("/loans")}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
              <Landmark className="size-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{loan.name}</h1>
                <Badge className={`text-xs ${STATUS_BADGE[loan.status]}`}>
                  {STATUS_LABELS[loan.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{loan.lender}</p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="size-9 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4">
          <div className="px-6 py-5 bg-red-500/5">
            <p className="text-xs font-semibold tracking-widest text-red-600 dark:text-red-500 uppercase mb-2">Saldo pendiente</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-500">{fmt(loan.balance)}</p>
            <p className="text-xs text-muted-foreground mt-1">de {fmt(loan.principal)} inicial</p>
          </div>
          <div className="px-6 py-5 border-l">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">Cuota mensual</p>
            <p className="text-2xl font-bold">{fmt(loan.monthly_payment)}</p>
            <p className="text-xs text-muted-foreground mt-1">Día {loan.payment_day} de cada mes</p>
          </div>
          <div className="px-6 py-5 border-l">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">Tasa de interés</p>
            <p className="text-2xl font-bold">{loan.interest_rate}%</p>
            <p className="text-xs text-muted-foreground mt-1">Efectiva anual</p>
          </div>
          <div className="px-6 py-5 border-l bg-primary/5">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-2">Pagado</p>
            <p className="text-2xl font-bold text-primary">{pctPaid}%</p>
            <p className="text-xs text-muted-foreground mt-1">{fmt(paidAmount)} abonado</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{fmtDate(loan.start_date)}</span>
            <span>{fmtDate(loan.end_date)}</span>
          </div>
          <Progress value={pctPaid} className="h-2 [&>div]:bg-primary" />
        </div>
      </div>

      {/* Payment summary */}
      {payments.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-4 border-b">
            <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
              <CreditCard className="size-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Historial de pagos</p>
              <p className="text-xs text-muted-foreground">{payments.length} pagos registrados</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold text-green-600 dark:text-green-400">{fmt(totalPrincipalPaid)} capital</p>
              <p className="text-xs text-muted-foreground">{fmt(totalInterestPaid)} intereses</p>
            </div>
          </div>
          <div className="divide-y">
            {[...payments]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((p) => (
                <div key={p.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{p.period}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(p.date)}</p>
                  </div>
                  <div className="text-right text-sm shrink-0">
                    <p className="font-semibold">{fmt(p.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmt(p.principal_paid)} capital · {fmt(p.interest_paid)} interés
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Amortization table */}
      {amortization.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-4 border-b">
            <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
              <CalendarDays className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">Tabla de amortización</p>
              <p className="text-xs text-muted-foreground">{amortization.length} cuotas totales</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="px-6 py-3 text-left font-semibold">#</th>
                  <th className="px-6 py-3 text-left font-semibold">Período</th>
                  <th className="px-6 py-3 text-right font-semibold">Capital</th>
                  <th className="px-6 py-3 text-right font-semibold">Interés</th>
                  <th className="px-6 py-3 text-right font-semibold">Saldo</th>
                  <th className="px-6 py-3 text-center font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {displayedAmortization.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-muted/20 transition-colors ${row.is_paid ? "opacity-50" : ""}`}
                  >
                    <td className="px-6 py-3 tabular-nums text-muted-foreground">{row.payment_number}</td>
                    <td className="px-6 py-3">{row.period}</td>
                    <td className="px-6 py-3 text-right tabular-nums text-green-600 dark:text-green-400">
                      {fmt(row.principal_payment)}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums text-red-500">
                      {fmt(row.interest_payment)}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums font-semibold">
                      {fmt(row.balance_after)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {row.is_paid
                        ? <CheckCircle2 className="size-4 text-green-500 mx-auto" />
                        : <Clock className="size-4 text-muted-foreground mx-auto" />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {amortization.length > 12 && (
            <div className="px-6 py-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground w-full"
                onClick={() => setShowAllAmortization((v) => !v)}
              >
                {showAllAmortization
                  ? <><ChevronUp className="size-4 mr-2" /> Ver menos</>
                  : <><ChevronDown className="size-4 mr-2" /> Ver las {amortization.length - 12} cuotas restantes</>
                }
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty state when no amortization */}
      {amortization.length === 0 && payments.length === 0 && (
        <div className="rounded-xl border bg-card">
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Percent className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hay datos de amortización ni pagos registrados.</p>
          </div>
        </div>
      )}
    </div>
  )
}
