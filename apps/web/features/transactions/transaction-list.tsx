"use client"

import { useState, useMemo } from "react"
import {
  Plus, Pencil, Trash2,
  ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, PiggyBank, ReceiptText, CreditCard,
  Filter, X, Download, Loader2, ChevronLeft, ChevronRight, RefreshCw,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import type { ExportCsvLabels } from "./export-csv"
import type { ExportPdfLabels } from "./export-pdf"
import { LOCALE_TAG } from "@/lib/dates"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { DatePicker } from "@workspace/ui/components/date-picker"
import { SearchSelect } from "@workspace/ui/components/search-select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

import { TransactionForm } from "./transaction-form"
import { transactionApi } from "./api"
import { exportTransactionsCSV } from "./export-csv"
import { exportTransactionsPDF } from "./export-pdf"
import type { Transaction } from "./types"
import type { Account } from "@/features/accounts/types"
import type { Category } from "@/features/categories/types"
import type { SavingGoal } from "@/features/savings/types"
import type { Loan } from "@/features/loans/types"
import type { Locale } from "@/i18n/routing"
import { useCurrency } from "@/hooks/use-currency"

const TYPE_ICONS = {
  income: ArrowUpCircle,
  expense: ArrowDownCircle,
  transfer: ArrowRightLeft,
  saving: PiggyBank,
  credit_card_charge: CreditCard,
}

const TYPE_ICON_BG = {
  income: "bg-green-500/10",
  expense: "bg-red-500/10",
  transfer: "bg-blue-500/10",
  saving: "bg-purple-500/10",
  credit_card_charge: "bg-orange-500/10",
}

const TYPE_COLORS = {
  income: "text-green-500",
  expense: "text-red-500",
  transfer: "text-blue-500",
  saving: "text-purple-500",
  credit_card_charge: "text-orange-500",
}

const TYPE_AMOUNT_COLORS = {
  income: "text-green-500",
  expense: "text-red-500",
  transfer: "text-blue-500",
  saving: "text-purple-500",
  credit_card_charge: "text-orange-500",
}

// TYPE_LABELS are handled via useTranslations in the component

interface TransactionListProps {
  token: string
  isPro: boolean
  userName: string
  userEmail: string
  initialTransactions: Transaction[]
  initialNextToken: string | null
  accounts: Account[]
  categories: Category[]
  savingGoals: SavingGoal[]
  loans: Loan[]
}

export function TransactionList({ token, isPro, userName, userEmail, initialTransactions, initialNextToken, accounts, categories, savingGoals, loans }: TransactionListProps) {
  const locale = useLocale() as Locale
  const t = useTranslations("transactions")
  const tExport = useTranslations("public.export")
  const TYPE_LABELS = {
    income: t("typeIncome"),
    expense: t("typeExpense"),
    transfer: t("typeTransfer"),
    saving: t("typeSaving"),
    credit_card_charge: t("typeCreditCardCharge"),
  }
  const [pageSize, setPageSize] = useState(20)
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [nextToken, setNextToken] = useState<string | null>(initialNextToken)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [openForm, setOpenForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  // Filters
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [filterAccountId, setFilterAccountId] = useState("all")
  const [filterCategoryId, setFilterCategoryId] = useState("all")
  const [filterType, setFilterType] = useState("all")

  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a.name]))
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  function handleCreated(tx: Transaction) {
    setTransactions((prev) => [tx, ...prev])
    setOpenForm(false)
  }

  function handleUpdated(tx: Transaction) {
    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? tx : t)))
    setEditingTransaction(null)
  }

  async function handleDelete(id: string) {
    try {
      await transactionApi.delete(id, token)
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      toast.success(t("deleted"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorDeleting"))
    }
  }

  function closeSheet() {
    setOpenForm(false)
    setEditingTransaction(null)
  }

  async function handleLoadMore() {
    if (!nextToken || loadingMore) return
    setLoadingMore(true)
    try {
      const page = await transactionApi.listPage(token, { limit: 50, next_token: nextToken })
      setTransactions((prev) => [...prev, ...page.items])
      setNextToken(page.next_token)
    } catch {
      toast.error(t("errorLoading"))
    } finally {
      setLoadingMore(false)
    }
  }

  function resetFilters() {
    setDateFrom("")
    setDateTo("")
    setFilterAccountId("all")
    setFilterCategoryId("all")
    setFilterType("all")
    setPage(1)
  }

  const hasActiveFilters = dateFrom || dateTo || filterAccountId !== "all" || filterCategoryId !== "all" || filterType !== "all"

  const fmt = useCurrency()

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense

  // Filtered + sorted list
  const filteredSorted = useMemo(() => {
    let result = [...transactions]

    if (filterType !== "all") result = result.filter((t) => t.type === filterType)
    if (filterAccountId !== "all") result = result.filter((t) => t.account_id === filterAccountId)
    if (filterCategoryId !== "all") result = result.filter((t) => t.category_id === filterCategoryId)
    if (dateFrom) result = result.filter((t) => t.date.slice(0, 10) >= dateFrom)
    if (dateTo) result = result.filter((t) => t.date.slice(0, 10) <= dateTo)

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, filterType, filterAccountId, filterCategoryId, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filteredSorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  // Group paginated by date
  const groupedByDate = useMemo(() => {
    const groups: { label: string; transactions: Transaction[] }[] = []
    const map = new Map<string, Transaction[]>()

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const todayKey = today.toISOString().slice(0, 10)
    const yesterdayKey = yesterday.toISOString().slice(0, 10)

    for (const tx of paginated) {
      const key = new Date(tx.date).toISOString().slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(tx)
    }

    for (const [key, txs] of map.entries()) {
      let label: string
      if (key === todayKey) label = t("today")
      else if (key === yesterdayKey) label = t("yesterday")
      else label = new Date(key + "T12:00:00").toLocaleDateString(LOCALE_TAG[locale], {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
      groups.push({ label, transactions: txs })
    }

    return groups
  }, [paginated])

  return (
    <div className="flex flex-col gap-6">

      {/* Header section */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Title + button */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
              <ReceiptText className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t("title")}</h1>
              <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPro && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const csvLabels: ExportCsvLabels = {
                      date: tExport("date"),
                      type: tExport("type"),
                      description: tExport("description"),
                      account: tExport("account"),
                      category: tExport("category"),
                      amount: tExport("amount"),
                      typeIncome: tExport("typeIncome"),
                      typeExpense: tExport("typeExpense"),
                      typeTransfer: tExport("typeTransfer"),
                      typeSaving: tExport("typeSaving"),
                      typeCreditCardCharge: tExport("typeCreditCardCharge"),
                    }
                    exportTransactionsCSV(filteredSorted, accounts, categories, locale, csvLabels)
                  }}
                >
                  <Download className="size-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const pdfLabels: ExportPdfLabels = {
                      date: tExport("date"),
                      type: tExport("type"),
                      description: tExport("description"),
                      account: tExport("account"),
                      category: tExport("category"),
                      amount: tExport("amount"),
                      typeIncome: tExport("typeIncome"),
                      typeExpense: tExport("typeExpense"),
                      typeTransfer: tExport("typeTransfer"),
                      typeSaving: tExport("typeSaving"),
                      typeCreditCardCharge: tExport("typeCreditCardCharge"),
                      reportTitle: tExport("reportTitle"),
                      generatedOn: tExport("generatedOn"),
                      numTransactions: tExport("numTransactions", { count: filteredSorted.length }),
                      totalIncome: tExport("totalIncome"),
                      totalExpenses: tExport("totalExpenses"),
                      netBalance: tExport("netBalance"),
                      expensesByCategory: tExport("expensesByCategory"),
                      transactionDetail: tExport("transactionDetail"),
                      confidential: tExport("confidential"),
                      page: (p, total) => tExport("page", { page: p, total }),
                      pctOfExpenses: tExport("pctOfExpenses"),
                      noData: tExport("noData"),
                      noCategory: tExport("noCategory"),
                    }
                    exportTransactionsPDF(filteredSorted, accounts, categories, userName, userEmail, locale, pdfLabels)
                  }}
                >
                  <Download className="size-4" />
                  PDF
                </Button>
              </>
            )}
            <Button onClick={() => setOpenForm(true)}>
              <Plus className="size-4" />
              {t("newTransaction")}
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3">
          <div className="px-6 py-5 bg-green-500/5">
            <p className="text-xs font-semibold tracking-widest text-green-600 dark:text-green-500 uppercase mb-2">{t("totalIncome")}</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-500">$ {fmt(totalIncome)}</p>
          </div>
          <div className="px-6 py-5 bg-red-500/5 border-x">
            <p className="text-xs font-semibold tracking-widest text-red-600 dark:text-red-500 uppercase mb-2">{t("totalExpenses")}</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-500">$ {fmt(totalExpense)}</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">{t("balance")}</p>
            <p className={`text-3xl font-bold ${balance >= 0 ? "text-foreground" : "text-red-500"}`}>
              $ {fmt(Math.abs(balance))}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction list section */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Section header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b">
          <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
            <ReceiptText className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{t("allTransactions")}</p>
            <p className="text-xs text-muted-foreground">
              {hasActiveFilters
                ? t("countFiltered", { count: filteredSorted.length, total: transactions.length })
                : t("countRegistered", { count: transactions.length })}
            </p>
          </div>
          {hasActiveFilters && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Filter className="size-3" />
              {t("activeFilters")}
            </Badge>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b bg-muted/20">
          <SearchSelect
            value={filterType}
            onValueChange={(v) => { setFilterType(v); setPage(1) }}
            options={[
              { value: "all", label: t("allTypes") },
              { value: "income", label: t("income") },
              { value: "expense", label: t("expenses") },
              { value: "transfer", label: t("transfers") },
              { value: "saving", label: t("savings") },
            ]}
            placeholder={t("type")}
            className="h-8 w-36 text-xs"
          />

          <SearchSelect
            value={filterAccountId}
            onValueChange={(v) => { setFilterAccountId(v); setPage(1) }}
            options={[
              { value: "all", label: t("allAccounts") },
              ...accounts.map((a) => ({ value: a.id, label: a.name })),
            ]}
            placeholder={t("account")}
            className="h-8 w-40 text-xs"
          />

          <SearchSelect
            value={filterCategoryId}
            onValueChange={(v) => { setFilterCategoryId(v); setPage(1) }}
            options={[
              { value: "all", label: t("allCategories") },
              ...categories.map((c) => ({ value: c.id, label: `${c.icon ? c.icon + " " : ""}${c.name}` })),
            ]}
            placeholder={t("category")}
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
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1 text-xs text-muted-foreground"
              onClick={resetFilters}
            >
              <X className="size-3" />
              {t("clear")}
            </Button>
          )}
        </div>

        {filteredSorted.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-16">
            {hasActiveFilters ? t("noResults") : t("noTransactions")}
          </p>
        ) : (
          <>
            <div>
              {groupedByDate.map((group) => (
                <div key={group.label}>
                  {/* Date header */}
                  <div className="px-6 py-2 bg-muted/40 border-y first:border-t-0">
                    <p className="text-xs font-semibold text-muted-foreground capitalize" suppressHydrationWarning>
                      {group.label}
                    </p>
                  </div>
                  {/* Transactions for this day */}
                  <div className="divide-y">
                    {group.transactions.map((tx) => {
                      const Icon = TYPE_ICONS[tx.type]
                      const iconBg = TYPE_ICON_BG[tx.type]
                      const iconColor = TYPE_COLORS[tx.type]
                      const amountColor = TYPE_AMOUNT_COLORS[tx.type]
                      const isExpense = tx.type === "expense"
                      return (
                        <div key={tx.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group">
                          <div className={`flex items-center justify-center size-10 rounded-full shrink-0 ${iconBg}`}>
                            <Icon className={`size-5 ${iconColor}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {tx.description ?? TYPE_LABELS[tx.type]}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-xs text-muted-foreground">
                                {tx.account_id ? (accountMap[tx.account_id] ?? tx.account_id) : t("typeCreditCardCharge")}
                              </span>
                              {tx.category_id && (
                                <>
                                  <span className="text-xs text-muted-foreground">·</span>
                                  <Badge variant="outline" className="text-xs h-5 px-2">
                                    {categoryMap[tx.category_id] ?? tx.category_id}
                                  </Badge>
                                </>
                              )}
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                                {new Date(tx.date).toLocaleTimeString(LOCALE_TAG[locale], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              {tx.is_recurring && (
                                <>
                                  <span className="text-xs text-muted-foreground">·</span>
                                  <Badge variant="secondary" className="text-xs h-5 px-2 gap-1">
                                    <RefreshCw className="size-2.5" />
                                    {t("recurringBadge")}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>

                          <p className={`text-base font-bold shrink-0 ${amountColor}`}>
                            {(isExpense || tx.type === "credit_card_charge") ? "-" : "+"}$ {fmt(tx.amount)}
                          </p>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setEditingTransaction(tx)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(tx.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/10">
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {t("page", { page: safePage, total: totalPages })}
                  {nextToken && ` · ${t("loaded", { count: transactions.length })}`}
                </p>
                <div className="flex items-center gap-1">
                  {[10, 20, 50, 100].map((size) => (
                    <button
                      type="button"
                      key={size}
                      onClick={() => { setPageSize(size); setPage(1) }}
                      className={`h-6 px-2 rounded text-xs border transition-colors ${pageSize === size ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…")
                    acc.push(p)
                    return acc
                  }, [])
                  .map((item, idx) =>
                    item === "…" ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">…</span>
                    ) : (
                      <Button
                        key={item}
                        variant={item === safePage ? "default" : "outline"}
                        size="icon"
                        className="size-8 text-xs"
                        onClick={() => setPage(item as number)}
                      >
                        {item}
                      </Button>
                    )
                  )}
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={async () => {
                    if (safePage >= totalPages && nextToken) {
                      await handleLoadMore()
                      setPage((p) => p + 1)
                    } else {
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                  }}
                  disabled={safePage >= totalPages && !nextToken || loadingMore}
                >
                  {loadingMore ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-4" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog
        open={openForm || editingTransaction !== null}
        onOpenChange={(open) => { if (!open) closeSheet() }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? t("dialogTitleEdit") : t("dialogTitleNew")}
            </DialogTitle>
            <DialogDescription>
              {editingTransaction
                ? t("dialogDescEdit")
                : t("dialogDescNew")}
            </DialogDescription>
          </DialogHeader>
          <TransactionForm
            token={token}
            accounts={accounts}
            categories={categories}
            savingGoals={savingGoals}
            loans={loans}
            initialValues={editingTransaction ?? undefined}
            isPro={isPro}
            onSuccess={editingTransaction ? handleUpdated : handleCreated}
            onCancel={closeSheet}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
