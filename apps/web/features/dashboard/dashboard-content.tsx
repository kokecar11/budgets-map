"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  ArrowUpRight,
  Landmark,
  ChevronRight,
  Target,
  AlertTriangle,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import type { Transaction } from "@/features/transactions/types"
import type { Account } from "@/features/accounts/types"
import type { SavingGoal } from "@/features/savings/types"
import type { Loan } from "@/features/loans/types"
import type { Category } from "@/features/categories/types"
import type { Budget, BudgetItem } from "@/features/budgets/types"
import { parseDateParts, fmtDateLocal, LOCALE_TAG } from "@/lib/dates"
import type { Locale } from "@/i18n/routing"
import { useCurrency } from "@/hooks/use-currency"
import { TrendCharts } from "./trend-charts"
import { computeBudgetAlerts } from "@/features/budgets/alerts"
import { isExpenseForModel } from "@/features/transactions/expense-model"
import { useFinancialRules } from "@/contexts/financial-rules-context"
import { RecurringSummary } from "./recurring-summary"
import { PremiumGate } from "@/components/premium-gate"

interface DashboardContentProps {
  isPro: boolean
  transactions: Transaction[]
  accounts: Account[]
  savingGoals: SavingGoal[]
  loans: Loan[]
  categories: Category[]
  currentBudget?: Budget
  budgetItems: BudgetItem[]
}

export function DashboardContent({
  isPro,
  transactions,
  accounts,
  savingGoals,
  loans,
  categories,
  currentBudget,
  budgetItems,
}: DashboardContentProps) {
  const locale = useLocale() as Locale
  const t = useTranslations("dashboard")
  const fmt = useCurrency()
  const { rules } = useFinancialRules()
  const expenseModel = rules.expense_model
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const monthName = now.toLocaleDateString(LOCALE_TAG[locale], { month: "long", year: "numeric" })

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  )
  const accountMap = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a])),
    [accounts]
  )

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear

  const { monthlyIncome, monthlyExpenses, monthTxnIncome, monthTxnExpense, prevIncome, prevExpenses } = useMemo(() => {
    let monthlyIncome = 0
    let monthlyExpenses = 0
    let monthTxnIncome = 0
    let monthTxnExpense = 0
    let prevIncome = 0
    let prevExpenses = 0
    for (const t of transactions) {
      const { month: m, year: y } = parseDateParts(t.date)
      const isExpense = isExpenseForModel(t, expenseModel)
      if (m === currentMonth && y === currentYear) {
        if (t.type === "income") { monthlyIncome += t.amount; monthTxnIncome++ }
        if (isExpense) { monthlyExpenses += t.amount; monthTxnExpense++ }
      } else if (m === prevMonth && y === prevYear) {
        if (t.type === "income") prevIncome += t.amount
        if (isExpense) prevExpenses += t.amount
      }
    }
    return { monthlyIncome, monthlyExpenses, monthTxnIncome, monthTxnExpense, prevIncome, prevExpenses }
  }, [transactions, currentMonth, currentYear, prevMonth, prevYear, expenseModel])

  const totalBalance = useMemo(
    () => accounts.filter((a) => a.is_active).reduce((s, a) => s + a.balance, 0),
    [accounts]
  )
  const netMonth = monthlyIncome - monthlyExpenses
  const prevNet = prevIncome - prevExpenses

  function trendPct(current: number, prev: number): number | null {
    if (prev === 0) return null
    return ((current - prev) / prev) * 100
  }

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10),
    [transactions]
  )

  const goalProgressMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of transactions) {
      if (t.type === "saving" && t.saving_goal_id) {
        map[t.saving_goal_id] = (map[t.saving_goal_id] ?? 0) + t.amount
      }
    }
    return map
  }, [transactions])


  const alertCount = useMemo(
    () => computeBudgetAlerts(
      budgetItems,
      currentBudget?.alert_warning_pct ?? 80,
      currentBudget?.alert_danger_pct ?? 100,
    ).length,
    [budgetItems, currentBudget]
  )

  const totalPlanned = budgetItems.reduce((s, i) => s + i.planned_amount, 0)
  const totalSpentOnBudget = budgetItems.reduce((s, i) => {
    const spent = i.actual_amount ?? (i.is_paid ? i.planned_amount : 0)
    return s + spent
  }, 0)
  const activeGoals = savingGoals.filter((g) => g.status === "active")
  const activeLoans = loans.filter((l) => l.status === "active")
  const totalDebt = activeLoans.reduce((s, l) => s + l.balance, 0)

  return (
    <div className="p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-4 px-6 py-5">
          <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
            <LayoutDashboard className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground capitalize">{monthName}</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("totalBalance")}
          value={fmt(totalBalance)}
          sub={t("activeAccounts", { count: accounts.filter((a) => a.is_active).length })}
          icon={<Wallet className="size-5" />}
          color="primary"
        />
        <StatCard
          title={t("monthlyIncome")}
          value={fmt(monthlyIncome)}
          sub={t("transactions", { count: monthTxnIncome })}
          icon={<TrendingUp className="size-5" />}
          color="neutral"
          trend={{ pct: trendPct(monthlyIncome, prevIncome), positiveIsGood: true }}
        />
        <StatCard
          title={t("monthlyExpenses")}
          value={fmt(monthlyExpenses)}
          sub={t("transactions", { count: monthTxnExpense })}
          icon={<TrendingDown className="size-5" />}
          color="red"
          trend={{ pct: trendPct(monthlyExpenses, prevExpenses), positiveIsGood: false }}
        />
        <StatCard
          title={t("netBalance")}
          value={fmt(Math.abs(netMonth))}
          sub={netMonth >= 0 ? t("surplus") : t("deficit")}
          icon={netMonth >= 0 ? <Scale className="size-5" /> : <ArrowUpRight className="size-5" />}
          color={netMonth >= 0 ? "green" : "red"}
          prefix={netMonth >= 0 ? "+" : "-"}
          trend={{ pct: trendPct(netMonth, prevNet), positiveIsGood: true }}
        />
      </div>

      {/* Budget Alerts — compact banner linking to /notifications (Pro only) */}
      {isPro && alertCount > 0 && (
        <Link
          href="/notifications"
          className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-5 py-3 hover:bg-yellow-500/10 transition-colors"
        >
          <AlertTriangle className="size-4 text-yellow-500 shrink-0" />
          <span className="text-sm font-medium flex-1">{t("alertsBannerText", { count: alertCount })}</span>
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        </Link>
      )}

      {/* Recurring this month */}
      <RecurringSummary
        transactions={transactions}
        categories={categories}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />

      {/* Recent Transactions */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
              <TrendingUp className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">{t("recentTransactions")}</p>
              <p className="text-xs text-muted-foreground">{t("recentCount", { count: recentTransactions.length })}</p>
            </div>
          </div>
          <Link href="/transactions" className="flex items-center gap-1 text-sm text-primary hover:underline">
            {t("viewAll")} <ChevronRight className="size-4" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-12">{t("noTransactions")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs uppercase tracking-widest">
                  <th className="text-left px-6 py-3 font-semibold">{t("date")}</th>
                  <th className="text-left px-6 py-3 font-semibold">{t("description")}</th>
                  <th className="text-left px-6 py-3 font-semibold">{t("category")}</th>
                  <th className="text-left px-6 py-3 font-semibold">{t("account")}</th>
                  <th className="text-left px-6 py-3 font-semibold">{t("type")}</th>
                  <th className="text-right px-6 py-3 font-semibold">{t("amount")}</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t) => {
                  const category = t.category_id ? categoryMap[t.category_id] : null
                  const account = t.account_id ? accountMap[t.account_id] : undefined
                  const isNegative = t.type === "expense" || t.type === "credit_card_charge"
                  return (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {fmtDateLocal(t.date, undefined, locale)}
                      </td>
                      <td className="px-6 py-3 max-w-40 truncate font-medium">
                        {t.description || "—"}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {category?.name ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {account?.name ?? "—"}
                      </td>
                      <td className="px-6 py-3">
                        <TypeBadge type={t.type} />
                      </td>
                      <td className={`px-6 py-3 text-right font-bold tabular-nums ${isNegative ? "text-red-500" : "text-green-500"}`}>
                        {isNegative ? "−" : "+"}{fmt(t.amount)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Budget */}
      {currentBudget && budgetItems.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
                <TrendingDown className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">{t("budget")} — {currentBudget.name}</p>
                <p className="text-xs text-muted-foreground">{t("budgetExecution")}</p>
              </div>
            </div>
            <Link href={`/budgets/${currentBudget.id}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
              {t("viewDetail")} <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="px-6 py-5">
            {/* Overall bar */}
            <div className="mb-5">
              <div className="flex justify-between text-sm mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {totalPlanned > 0
                      ? t("budgetUsed", { pct: ((totalSpentOnBudget / totalPlanned) * 100).toFixed(0) })
                      : t("noBudgetDefined")}
                  </span>
                  {totalSpentOnBudget > totalPlanned && (
                    <span className="text-xs text-destructive font-medium">
                      · {t("exceeded", { amount: fmt(totalSpentOnBudget - totalPlanned) })}
                    </span>
                  )}
                  {totalSpentOnBudget <= totalPlanned && totalPlanned > 0 && (
                    <span className="text-xs text-green-500 font-medium">
                      · {t("available", { amount: fmt(totalPlanned - totalSpentOnBudget) })}
                    </span>
                  )}
                </div>
                <span className="tabular-nums text-muted-foreground text-xs font-medium">
                  {fmt(totalSpentOnBudget)} / {fmt(totalPlanned)}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all w-(--bar) ${budgetBarColor(totalSpentOnBudget, totalPlanned, currentBudget?.alert_warning_pct ?? 80, currentBudget?.alert_danger_pct ?? 100)}`}
                  style={{ "--bar": `${Math.min(100, totalPlanned > 0 ? (totalSpentOnBudget / totalPlanned) * 100 : 0)}%` } as React.CSSProperties}
                />
              </div>
            </div>

            {/* Per-item list */}
            <div className="divide-y">
              {budgetItems.slice(0, 5).map((item) => {

                const spent = item.actual_amount ?? (item.is_paid ? item.planned_amount : 0)
                const categoryName = item.category_id ? (categoryMap[item.category_id]?.name ?? null) : null
                const isOver = spent > item.planned_amount
                return (
                  <div key={item.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-sm truncate">{item.description}</span>
                      {categoryName && (
                        <span className="text-xs text-muted-foreground shrink-0">({categoryName})</span>
                      )}
                      {item.is_paid && (
                        <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full shrink-0 font-medium">
                          {t("paid_badge")}
                        </span>
                      )}
                    </div>
                    <span className={`tabular-nums text-sm whitespace-nowrap ml-4 ${isOver ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                      {fmt(spent)} / {fmt(item.planned_amount)}
                    </span>
                  </div>
                )
              })}
            </div>
            {budgetItems.length > 5 && (
              <div className="pt-3 text-center">
                <Link href={`/budgets/${currentBudget!.id}`} className="text-xs text-primary hover:underline">
                  {t("viewAllItems", { count: budgetItems.length })}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {!currentBudget && (
        <div className="rounded-xl border border-dashed bg-card px-6 py-8 text-center">
          <p className="text-muted-foreground text-sm">
            {t("noBudget")}{" "}
            <Link href="/budgets" className="text-primary hover:underline font-medium">
              {t("createBudget")}
            </Link>
          </p>
        </div>
      )}

      {/* Accounts + Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
                <Wallet className="size-5 text-muted-foreground" />
              </div>
              <p className="font-semibold">{t("accounts")}</p>
            </div>
            <Link href="/accounts" className="flex items-center gap-1 text-sm text-primary hover:underline">
              {t("manage")} <ChevronRight className="size-4" />
            </Link>
          </div>
          {accounts.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-10">{t("noAccounts")}</p>
          ) : (
            <div className="divide-y">
              {accounts.filter((a) => a.is_active).slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="font-medium text-sm">{a.name}</p>
                    <p className="text-xs text-muted-foreground"><AccountTypeLabel type={a.type} /></p>
                  </div>
                  <span className={`font-semibold tabular-nums text-sm ${a.balance < 0 ? "text-destructive" : ""}`}>
                    {fmt(a.balance)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center px-6 py-3 bg-muted/20">
                <span className="font-bold text-sm">{t("totalAccounts")}</span>
                <span className="font-bold tabular-nums text-sm">{fmt(totalBalance)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Savings Goals */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
                <Target className="size-5 text-muted-foreground" />
              </div>
              <p className="font-semibold">{t("savingGoals")}</p>
            </div>
            <Link href="/savings" className="flex items-center gap-1 text-sm text-primary hover:underline">
              {t("viewAllGoals")} <ChevronRight className="size-4" />
            </Link>
          </div>
          {activeGoals.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-10">{t("noActiveGoals")}</p>
          ) : (
            <div className="divide-y">
              {activeGoals.slice(0, 5).map((g) => {
                const current = goalProgressMap[g.id] ?? g.current_amount ?? 0
                const pct = g.target_amount > 0
                  ? Math.min(100, (current / g.target_amount) * 100)
                  : 0
                return (
                  <div key={g.id} className="px-6 py-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium truncate mr-2">{g.name}</span>
                      <span className="text-muted-foreground whitespace-nowrap tabular-nums text-xs">
                        {fmt(current)} / {fmt(g.target_amount)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all w-(--bar)"
                        style={{ "--bar": `${pct}%` } as React.CSSProperties}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t("completed", { pct: pct.toFixed(0) })}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Active Loans */}
      {activeLoans.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
                <Landmark className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">{t("activeLoans")}</p>
                <p className="text-xs text-muted-foreground">{t("loansCount", { count: activeLoans.length })}</p>
              </div>
            </div>
            <Link href="/loans" className="flex items-center gap-1 text-sm text-primary hover:underline">
              {t("viewAllLoans")} <ChevronRight className="size-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs uppercase tracking-widest">
                  <th className="text-left px-6 py-3 font-semibold">{t("loanName")}</th>
                  <th className="text-left px-6 py-3 font-semibold">{t("lender")}</th>
                  <th className="text-right px-6 py-3 font-semibold">{t("principal")}</th>
                  <th className="text-right px-6 py-3 font-semibold">{t("pendingBalance")}</th>
                  <th className="text-right px-6 py-3 font-semibold">{t("monthlyPayment")}</th>
                </tr>
              </thead>
              <tbody>
                {activeLoans.slice(0, 5).map((l) => {
                  const paid = l.principal - l.balance
                  const pct = l.principal > 0 ? Math.min(100, (paid / l.principal) * 100) : 0
                  return (
                    <tr key={l.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3">
                        <p className="font-medium">{l.name}</p>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1.5 w-24">
                          <div className="h-full rounded-full bg-primary transition-all w-(--bar)" style={{ "--bar": `${pct}%` } as React.CSSProperties} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("paid", { pct: pct.toFixed(0) })}</p>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{l.lender}</td>
                      <td className="px-6 py-3 text-right tabular-nums">{fmt(l.principal)}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-red-500 font-semibold">{fmt(l.balance)}</td>
                      <td className="px-6 py-3 text-right tabular-nums">{fmt(l.monthly_payment)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/20">
                  <td colSpan={3} className="px-6 py-3 font-bold text-sm text-muted-foreground">{t("totalDebt")}</td>
                  <td className="px-6 py-3 text-right tabular-nums font-bold text-red-500">{fmt(totalDebt)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Tendencias (Pro) ── */}
      <PremiumGate isPro={isPro} featureName={t("trendFeature")}>
        <TrendCharts transactions={transactions} categories={categories} />
      </PremiumGate>

    </div>
  )
}

function StatCard({
  title,
  value,
  sub,
  icon,
  color,
  prefix,
  trend,
}: {
  title: string
  value: string
  sub: string
  icon: React.ReactNode
  color: "primary" | "neutral" | "green" | "red"
  prefix?: string
  trend?: { pct: number | null; positiveIsGood: boolean }
}) {
  const styles = {
    primary: {
      card: "bg-primary/5",
      label: "text-primary",
      icon: "text-primary",
    },
    neutral: {
      card: "",
      label: "text-muted-foreground",
      icon: "text-muted-foreground",
    },
    green: {
      card: "bg-green-500/5",
      label: "text-green-600 dark:text-green-500",
      icon: "text-green-500",
    },
    red: {
      card: "bg-red-500/5",
      label: "text-red-600 dark:text-red-500",
      icon: "text-red-500",
    },
  }
  const s = styles[color]

  const trendBadge = (() => {
    if (!trend || trend.pct === null) return null
    const up = trend.pct >= 0
    const good = up === trend.positiveIsGood
    return (
      <span className={`text-[11px] font-semibold tabular-nums ${good ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
        {up ? "↑" : "↓"} {Math.abs(trend.pct).toFixed(0)}%
      </span>
    )
  })()

  return (
    <div className={`rounded-xl border bg-card overflow-hidden ${s.card}`}>
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-3">
          <p className={`text-xs font-semibold tracking-widest uppercase ${s.label}`}>{title}</p>
          <span className={s.icon}>{icon}</span>
        </div>
        <div className="flex items-end justify-between gap-2">
          <p className="text-2xl font-bold">
            {prefix}{value}
          </p>
          {trendBadge}
        </div>
        <p className={`text-xs mt-1 ${s.label}`}>{sub}</p>
      </div>
    </div>
  )
}

function TypeBadge({ type }: { type: Transaction["type"] }) {
  const t = useTranslations("dashboard")
  const map: Record<Transaction["type"], { labelKey: string; className: string }> = {
    income: { labelKey: "typeIncome", className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
    expense: { labelKey: "typeExpense", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
    transfer: { labelKey: "typeTransfer", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
    saving: { labelKey: "typeSaving", className: "bg-primary/10 text-primary border-primary/20" },
    credit_card_charge: { labelKey: "typeCreditCardCharge", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
  }
  const { labelKey, className } = map[type]
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {t(labelKey as Parameters<typeof t>[0])}
    </span>
  )
}

function budgetBarColor(spent: number, planned: number, warningPct = 80, dangerPct = 100): string {
  if (planned === 0) return "bg-muted-foreground"
  const pct = (spent / planned) * 100
  if (pct >= dangerPct) return "bg-destructive"
  if (pct >= warningPct) return "bg-yellow-400"
  return "bg-green-500"
}

function AccountTypeLabel({ type }: { type: string }) {
  const t = useTranslations("dashboard")
  const key = type === "bank" ? "accountTypeBank" : type === "cash" ? "accountTypeCash" : type === "digital_wallet" ? "accountTypeDigitalWallet" : null
  return <>{key ? t(key as Parameters<typeof t>[0]) : type}</>
}
