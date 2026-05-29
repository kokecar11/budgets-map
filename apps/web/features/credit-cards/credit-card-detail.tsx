"use client"

import { useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import {
  Plus, Trash2, Pencil, CreditCard as CreditCardIcon, ArrowDownCircle,
  CalendarDays, Percent, TrendingUp, ChevronRight, ChevronLeft,
  Filter, X, RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { useLocale, useTranslations } from "next-intl"
import { LOCALE_TAG } from "@/lib/dates"
import type { Locale } from "@/i18n/routing"
import { useCurrency } from "@/hooks/use-currency"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Progress } from "@workspace/ui/components/progress"
import { SearchSelect } from "@workspace/ui/components/search-select"
import { DatePicker } from "@workspace/ui/components/date-picker"
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

type CCRow =
  | { kind: "charge"; data: CreditCardTransaction }
  | { kind: "payment"; data: CreditCardPayment }

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
  const [editMode, setEditMode] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<CreditCardPayment | null>(null)

  // Migration + filters + pagination
  const [migrating, setMigrating] = useState(false)
  const [filterKind, setFilterKind] = useState<"all" | "charge" | "payment">("all")
  const [filterCategoryId, setFilterCategoryId] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

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

  const filteredSorted = useMemo(() => {
    const allRows: CCRow[] = [
      ...charges.map((c) => ({ kind: "charge" as const, data: c })),
      ...payments.map((p) => ({ kind: "payment" as const, data: p })),
    ]
    let result = allRows
    if (filterKind !== "all") result = result.filter((r) => r.kind === filterKind)
    if (filterCategoryId !== "all") {
      result = result.filter((r) =>
        r.kind === "charge" ? r.data.category_id === filterCategoryId : true
      )
    }
    if (dateFrom) result = result.filter((r) => new Date(r.data.date).toISOString().slice(0, 10) >= dateFrom)
    if (dateTo) result = result.filter((r) => new Date(r.data.date).toISOString().slice(0, 10) <= dateTo)
    return result.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
  }, [charges, payments, filterKind, filterCategoryId, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filteredSorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  const groupedByDate = useMemo(() => {
    const groups: { label: string; rows: CCRow[] }[] = []
    const map = new Map<string, CCRow[]>()

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const todayKey = today.toISOString().slice(0, 10)
    const yesterdayKey = yesterday.toISOString().slice(0, 10)

    for (const row of paginated) {
      const key = new Date(row.data.date).toISOString().slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(row)
    }

    for (const [key, rows] of map.entries()) {
      let label: string
      if (key === todayKey) label = t("today")
      else if (key === yesterdayKey) label = t("yesterday")
      else label = new Date(key + "T12:00:00").toLocaleDateString(LOCALE_TAG[locale], {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
      groups.push({ label, rows })
    }

    return groups
  }, [paginated, locale, t])

  const hasActiveFilters = filterKind !== "all" || filterCategoryId !== "all" || !!dateFrom || !!dateTo

  function resetFilters() {
    setFilterKind("all")
    setFilterCategoryId("all")
    setDateFrom("")
    setDateTo("")
    setPage(1)
  }

  function handleChargeCreated(charge: CreditCardTransaction) {
    setCharges((prev) => [charge, ...prev])
    setOpenChargeForm(false)
  }

  function handlePaymentCreated(payment: CreditCardPayment) {
    setPayments((prev) => [payment, ...prev])
    setOpenPaymentForm(false)
  }

  function handleUpdateCharge(updated: CreditCardTransaction) {
    setCharges((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    setSelectedCharge(null)
    setEditMode(false)
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

  async function handleMigrate() {
    setMigrating(true)
    try {
      const { count } = await creditCardTransactionApi.migrate(card.id, session?.accessToken ?? "")
      if (count > 0) {
        toast.success(t("migrateSuccess", { count }))
      } else {
        toast.info(t("migrateNone"))
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setMigrating(false)
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
          <Button
            size="sm"
            variant="outline"
            onClick={handleMigrate}
            disabled={migrating}
            className="shrink-0"
          >
            <RefreshCw className={`size-4 ${migrating ? "animate-spin" : ""}`} />
            {migrating ? t("migrating") : t("migrateTransactions")}
          </Button>
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

      {/* Unified activity table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Section header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b">
          <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
            <CreditCardIcon className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{t("allActivity")}</p>
            <p className="text-xs text-muted-foreground">
              {hasActiveFilters
                ? t("countFiltered", { count: filteredSorted.length, total: charges.length + payments.length })
                : t("countActivity", { count: charges.length + payments.length })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Filter className="size-3" />
                {t("activeFilters")}
              </Badge>
            )}
            <Button size="sm" variant="outline" onClick={() => setOpenPaymentForm(true)}>
              <Plus className="size-4" />
              {t("registerPayment")}
            </Button>
            <Button size="sm" onClick={() => setOpenChargeForm(true)}>
              <Plus className="size-4" />
              {t("newCharge")}
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b bg-muted/20">
          <SearchSelect
            value={filterKind}
            onValueChange={(v) => { setFilterKind(v as "all" | "charge" | "payment"); setPage(1) }}
            options={[
              { value: "all", label: t("allKinds") },
              { value: "charge", label: t("filterCharge") },
              { value: "payment", label: t("filterPayment") },
            ]}
            placeholder={t("allKinds")}
            className="h-8 w-28 text-xs"
          />
          <SearchSelect
            value={filterCategoryId}
            onValueChange={(v) => { setFilterCategoryId(v); setPage(1) }}
            options={[
              { value: "all", label: t("allCategories") },
              ...categories.map((c) => ({ value: c.id, label: `${c.icon ? c.icon + " " : ""}${c.name}` })),
            ]}
            placeholder={t("allCategories")}
            className="h-8 w-40 text-xs"
          />
          <DatePicker
            value={dateFrom}
            onChange={(v) => { setDateFrom(v); setPage(1) }}
            placeholder={t("from")}
            className="h-8 w-36 text-xs"
          />
          <DatePicker
            value={dateTo}
            onChange={(v) => { setDateTo(v); setPage(1) }}
            placeholder={t("to")}
            className="h-8 w-36 text-xs"
          />
          {hasActiveFilters && (
            <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs text-muted-foreground" onClick={resetFilters}>
              <X className="size-3" />
              {t("clearFilters")}
            </Button>
          )}
        </div>

        {/* Rows */}
        {filteredSorted.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-16">{t("noActivity")}</p>
        ) : (
          <>
            <div>
              {groupedByDate.map((group) => (
                <div key={group.label}>
                  <div className="px-6 py-2 bg-muted/40 border-y first:border-t-0">
                    <p className="text-xs font-semibold text-muted-foreground capitalize" suppressHydrationWarning>
                      {group.label}
                    </p>
                  </div>
                  <div className="divide-y">
                    {group.rows.map((row) => {
                      if (row.kind === "charge") {
                        const charge = row.data
                        const cat = categoryMap[charge.category_id]
                        return (
                          <div
                            key={charge.id}
                            className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => setSelectedCharge(charge)}
                          >
                            <div className="flex items-center justify-center size-10 rounded-full shrink-0 bg-orange-500/10">
                              <CreditCardIcon className="size-5 text-orange-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{charge.description}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {cat && (
                                  <Badge variant="outline" className="text-xs h-5 px-2">
                                    {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                                  </Badge>
                                )}
                                {charge.installments > 1 && (
                                  <>
                                    {cat && <span className="text-xs text-muted-foreground">·</span>}
                                    <span className="text-xs text-muted-foreground">
                                      {t("installmentsLabel", { count: charge.installments })}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="text-base font-bold shrink-0 text-red-600">-${fmt(charge.amount)}</p>
                            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                          </div>
                        )
                      } else {
                        const payment = row.data
                        return (
                          <div
                            key={payment.id}
                            className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => setSelectedPayment(payment)}
                          >
                            <div className="flex items-center justify-center size-10 rounded-full shrink-0 bg-green-500/10">
                              <ArrowDownCircle className="size-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">
                                {t(`payment${payment.type.charAt(0).toUpperCase()}${payment.type.slice(1)}` as "paymentMinimum" | "paymentTotal" | "paymentPartial")}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PAYMENT_BADGE[payment.type]}`}>
                                  {t(`paymentType${payment.type.charAt(0).toUpperCase()}${payment.type.slice(1)}` as "paymentTypeMinimum" | "paymentTypeTotal" | "paymentTypePartial")}
                                </span>
                              </div>
                            </div>
                            <p className="text-base font-bold shrink-0 text-green-600">+${fmt(payment.amount)}</p>
                            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                          </div>
                        )
                      }
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/10">
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {t("page", { page: safePage, total: totalPages })}
              </p>
              <div className="flex items-center gap-1">
                {[10, 20, 50, 100].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => { setPageSize(size); setPage(1) }}
                    className={`h-6 px-2 rounded text-xs border transition-colors ${pageSize === size ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
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
      <Dialog open={!!selectedCharge} onOpenChange={(open) => { if (!open) { setSelectedCharge(null); setEditMode(false) } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {selectedCharge && (
            <>
              <DialogHeader>
                <DialogTitle className="truncate">
                  {editMode ? t("dialogTitleEditCharge") : selectedCharge.description}
                </DialogTitle>
                <DialogDescription>
                  {editMode
                    ? t("dialogDescEditCharge")
                    : new Date(selectedCharge.date).toLocaleDateString(LOCALE_TAG[locale], {
                        weekday: "long", year: "numeric", month: "long", day: "numeric",
                      })}
                </DialogDescription>
              </DialogHeader>

              {editMode ? (
                <CreditCardChargeForm
                  creditCardId={card.id}
                  categories={categories}
                  initialCharge={selectedCharge}
                  onSuccess={handleUpdateCharge}
                  onCancel={() => setEditMode(false)}
                />
              ) : (
                <div className="flex flex-col gap-6">
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

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setEditMode(true)}>
                      <Pencil className="size-4 mr-2" />
                      {t("editCharge")}
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => handleDeleteCharge(selectedCharge.id)}>
                      <Trash2 className="size-4 mr-2" />
                      {t("deleteCharge")}
                    </Button>
                  </div>
                </div>
              )}
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
