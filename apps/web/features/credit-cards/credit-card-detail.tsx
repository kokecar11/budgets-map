"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Plus, Trash2, CreditCard as CreditCardIcon, ArrowDownCircle, CalendarDays, Percent, TrendingUp, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { useLocale, useTranslations } from "next-intl"
import { LOCALE_TAG } from "@/lib/dates"
import type { Locale } from "@/i18n/routing"
import { useCurrency } from "@/hooks/use-currency"

import { Button } from "@workspace/ui/components/button"
import { Progress } from "@workspace/ui/components/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog"

import { CreditCardChargeForm } from "./credit-card-charge-form"
import { CreditCardPaymentForm } from "./credit-card-payment-form"
import { AmortizationTable } from "./amortization-table"
import { creditCardTransactionApi } from "./api"
import type { CreditCard, CreditCardTransaction, CreditCardPayment, CreditCardPeriod } from "./types"
import type { Account } from "@/features/accounts/types"
import type { Category } from "@/features/categories/types"

const PAYMENT_BADGE: Record<string, string> = {
  minimum: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  total: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  partial: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
}

interface CreditCardDetailProps {
  card: CreditCard
  initialCharges: CreditCardTransaction[]
  initialPayments: CreditCardPayment[]
  periods: CreditCardPeriod[]
  accounts: Account[]
  categories: Category[]
}

export function CreditCardDetail({
  card,
  initialCharges,
  initialPayments,
  periods,
  accounts,
  categories,
}: CreditCardDetailProps) {
  const { data: session } = useSession()
  const locale = useLocale() as Locale
  const t = useTranslations("creditCards")
  const [charges, setCharges] = useState<CreditCardTransaction[]>(initialCharges)
  const [payments, setPayments] = useState<CreditCardPayment[]>(initialPayments)

  // Form dialogs
  const [openChargeForm, setOpenChargeForm] = useState(false)
  const [openPaymentForm, setOpenPaymentForm] = useState(false)

  // Detail dialogs
  const [selectedCharge, setSelectedCharge] = useState<CreditCardTransaction | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<CreditCardPayment | null>(null)

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const totalCharged = charges.reduce((sum, c) => sum + c.amount, 0)
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const balance = totalCharged - totalPaid
  const available = card.credit_limit - balance
  const usagePercent = card.credit_limit > 0 ? Math.min((balance / card.credit_limit) * 100, 100) : 0

  const usageColor =
    usagePercent >= 90 ? "text-red-600" :
    usagePercent >= 75 ? "text-orange-500" :
    usagePercent >= 50 ? "text-yellow-600" :
    "text-green-600"

  const progressColor =
    usagePercent >= 90 ? "[&>div]:bg-red-500" :
    usagePercent >= 75 ? "[&>div]:bg-orange-400" :
    usagePercent >= 50 ? "[&>div]:bg-yellow-400" :
    "[&>div]:bg-green-500"

  function handleChargeCreated(charge: CreditCardTransaction) {
    setCharges((prev) => [charge, ...prev])
    setOpenChargeForm(false)
  }

  function handlePaymentCreated(payment: CreditCardPayment) {
    setPayments((prev) => [payment, ...prev])
    setOpenPaymentForm(false)
  }

  async function handleDeleteCharge(id: string) {
    try {
      await creditCardTransactionApi.delete(id, session?.accessToken ?? "")
      setCharges((prev) => prev.filter((c) => c.id !== id))
      if (selectedCharge?.id === id) setSelectedCharge(null)
      toast.success(t("chargeDeleted"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorDeletingCharge"))
    }
  }

  const fmt = useCurrency()

  return (
    <div className="flex flex-col gap-8">

      {/* Card summary widget */}
      <div className="rounded-xl border bg-card p-5 flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
            <CreditCardIcon className="size-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{card.alias}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="size-3" />
                {t("cutoffDay2", { day: card.cutoff_day, payment: card.payment_day })}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Percent className="size-3" />
                {t("annualRate", { rate: card.interest_rate })}
              </span>
            </div>
          </div>
        </div>

        {/* Usage progress */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="size-3" />
              {t("creditUsage")}
            </span>
            <span className={`font-semibold ${usageColor}`}>{usagePercent.toFixed(1)}%</span>
          </div>
          <Progress value={usagePercent} className={`h-2 ${progressColor}`} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x rounded-lg border overflow-hidden">
          <div className="flex flex-col gap-0.5 px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("limit")}</p>
            <p className="text-base font-semibold">${fmt(card.credit_limit)}</p>
          </div>
          <div className="flex flex-col gap-0.5 px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("used2")}</p>
            <p className={`text-base font-semibold ${usageColor}`}>${fmt(balance)}</p>
          </div>
          <div className="flex flex-col gap-0.5 px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("available2")}</p>
            <p className="text-base font-semibold text-green-600">${fmt(available)}</p>
          </div>
        </div>
      </div>

      {/* Cargos */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCardIcon className="size-4 text-red-500" />
            <h2 className="text-base font-semibold">{t("charges")}</h2>
            {charges.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {charges.length}
              </span>
            )}
          </div>
          <Button size="sm" onClick={() => setOpenChargeForm(true)}>
            <Plus className="size-4" />
            {t("newCharge")}
          </Button>
        </div>

        {charges.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-10 border rounded-lg border-dashed">
            {t("noCharges")}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {charges.map((charge) => {
              const cat = categoryMap[charge.category_id]
              return (
                <div
                  key={charge.id}
                  className="group flex items-center gap-3 rounded-lg border px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="size-8 shrink-0 rounded-md bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-sm">
                    {cat?.icon ?? <CreditCardIcon className="size-4 text-red-500" />}
                  </div>

                  <button
                    type="button"
                    className="flex-1 min-w-0 text-left"
                    onClick={() => setSelectedCharge(charge)}
                  >
                    <p className="text-sm font-medium truncate">{charge.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(charge.date).toLocaleDateString(LOCALE_TAG[locale])}
                      {cat ? ` · ${cat.name}` : ""}
                      {charge.installments > 1 ? ` · ${t("installmentsLabel", { count: charge.installments })}` : ""}
                    </p>
                  </button>

                  <p className="text-sm font-semibold text-red-600 shrink-0">
                    -${fmt(charge.amount)}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteCharge(charge.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                  <ChevronRight
                    className="size-4 text-muted-foreground shrink-0 cursor-pointer"
                    onClick={() => setSelectedCharge(charge)}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagos */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="size-4 text-green-500" />
            <h2 className="text-base font-semibold">{t("payments")}</h2>
            {payments.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {payments.length}
              </span>
            )}
          </div>
          <Button size="sm" onClick={() => setOpenPaymentForm(true)}>
            <Plus className="size-4" />
            {t("registerPayment")}
          </Button>
        </div>

        {payments.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-10 border rounded-lg border-dashed">
            {t("noPayments")}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center gap-3 rounded-lg border px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => setSelectedPayment(payment)}
              >
                <div className="size-8 shrink-0 rounded-md bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                  <ArrowDownCircle className="size-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{t(`payment${payment.type.charAt(0).toUpperCase()}${payment.type.slice(1)}` as "paymentMinimum" | "paymentTotal" | "paymentPartial")}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PAYMENT_BADGE[payment.type]}`}>
                      {t(`paymentType${payment.type.charAt(0).toUpperCase()}${payment.type.slice(1)}` as "paymentTypeMinimum" | "paymentTypeTotal" | "paymentTypePartial")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(payment.date).toLocaleDateString(LOCALE_TAG[locale])}
                  </p>
                </div>
                <p className="text-sm font-semibold text-green-600 shrink-0">
                  +${fmt(payment.amount)}
                </p>
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === Dialogs de formularios === */}

      {/* Nuevo cargo */}
      <Dialog open={openChargeForm} onOpenChange={(open) => { if (!open) setOpenChargeForm(false) }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("dialogTitleCharge")}</DialogTitle>
            <DialogDescription>{t("dialogDescCharge")}</DialogDescription>
          </DialogHeader>
          <CreditCardChargeForm
            creditCardId={card.id}
            categories={categories}
            onSuccess={handleChargeCreated}
            onCancel={() => setOpenChargeForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Registrar pago */}
      <Dialog open={openPaymentForm} onOpenChange={(open) => { if (!open) setOpenPaymentForm(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialogTitlePayment")}</DialogTitle>
            <DialogDescription>{t("dialogDescPayment")}</DialogDescription>
          </DialogHeader>
          <CreditCardPaymentForm
            card={card}
            periods={periods}
            accounts={accounts}
            onSuccess={handlePaymentCreated}
            onCancel={() => setOpenPaymentForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* === Dialogs de detalle === */}

      {/* Detalle de cargo */}
      <Dialog open={!!selectedCharge} onOpenChange={(open) => { if (!open) setSelectedCharge(null) }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {selectedCharge && (
            <>
              <DialogHeader>
                <DialogTitle className="truncate">{selectedCharge.description}</DialogTitle>
                <DialogDescription>
                  {new Date(selectedCharge.date).toLocaleDateString(LOCALE_TAG[locale], {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-6">
                {/* Resumen del cargo */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground mb-1">{t("chargeAmountDetail")}</p>
                    <p className="text-xl font-bold text-red-600">-${fmt(selectedCharge.amount)}</p>
                  </div>
                  {selectedCharge.installments > 1 && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground mb-1">{t("installmentsDetail")}</p>
                      <p className="text-xl font-bold">{selectedCharge.installments}</p>
                    </div>
                  )}
                  {selectedCharge.interest_rate ? (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground mb-1">{t("interestRateDetail")}</p>
                      <p className="text-xl font-bold">{selectedCharge.interest_rate}%</p>
                    </div>
                  ) : null}
                  {(() => {
                    const cat = categoryMap[selectedCharge.category_id]
                    if (!cat) return null
                    return (
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground mb-1">{t("categoryDetail")}</p>
                        <p className="text-sm font-semibold">
                          {cat.icon ? `${cat.icon} ` : ""}
                          {cat.name}
                        </p>
                      </div>
                    )
                  })()}
                </div>

                {/* Tabla de amortización */}
                {selectedCharge.installments > 1 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("amortizationTableLabel")}
                    </p>
                    <AmortizationTable
                      principal={selectedCharge.amount}
                      annualRateEA={selectedCharge.interest_rate ?? 0}
                      installments={selectedCharge.installments}
                      startDate={new Date(selectedCharge.date)}
                    />
                  </div>
                )}

                {/* Botón eliminar */}
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDeleteCharge(selectedCharge.id)}
                >
                  <Trash2 className="size-4 mr-2" />
                  {t("deleteCharge")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Detalle de pago */}
      <Dialog open={!!selectedPayment} onOpenChange={(open) => { if (!open) setSelectedPayment(null) }}>
        <DialogContent>
          {selectedPayment && (
            <>
              <DialogHeader>
                <DialogTitle>{t(`payment${selectedPayment.type.charAt(0).toUpperCase()}${selectedPayment.type.slice(1)}` as "paymentMinimum" | "paymentTotal" | "paymentPartial")}</DialogTitle>
                <DialogDescription>
                  {new Date(selectedPayment.date).toLocaleDateString(LOCALE_TAG[locale], {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground mb-1">{t("amountPaidDetail")}</p>
                  <p className="text-3xl font-bold text-green-600">+${fmt(selectedPayment.amount)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground mb-1">{t("paymentTypeDetail")}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${PAYMENT_BADGE[selectedPayment.type]}`}>
                      {t(`payment${selectedPayment.type.charAt(0).toUpperCase()}${selectedPayment.type.slice(1)}` as "paymentMinimum" | "paymentTotal" | "paymentPartial")}
                    </span>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground mb-1">{t("cardDetail")}</p>
                    <p className="text-sm font-semibold">{card.alias}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  {t("paymentNote")}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
