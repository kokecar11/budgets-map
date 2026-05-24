"use client"

import { useMemo } from "react"
import { Cell, Pie, PieChart } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, Landmark, CreditCard, Scale,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { PremiumGate } from "@/components/premium-gate"
import { useCurrency } from "@/hooks/use-currency"
import type { Account } from "@/features/accounts/types"
import type { SavingGoal } from "@/features/savings/types"
import type { Loan } from "@/features/loans/types"
import type { CreditCard as CreditCardType, CreditCardPeriod } from "@/features/credit-cards/types"

interface NetWorthContentProps {
  isPro: boolean
  accounts: Account[]
  savingGoals: SavingGoal[]
  loans: Loan[]
  creditCards: CreditCardType[]
  creditCardPeriods: Record<string, CreditCardPeriod[]>
}

const pieConfig = {
  assets:      { label: "assets",      color: "oklch(0.627 0.194 149.214)" },
  liabilities: { label: "liabilities", color: "oklch(0.637 0.237 25.331)" },
} satisfies ChartConfig

export function NetWorthContent({
  isPro, accounts, savingGoals, loans, creditCards, creditCardPeriods,
}: NetWorthContentProps) {
  const t = useTranslations("accounts")
  const fmt = useCurrency()

  const activeAccounts = useMemo(() => accounts.filter((a) => a.is_active), [accounts])
  const activeGoals    = useMemo(() => savingGoals.filter((g) => g.status === "active"), [savingGoals])
  const activeLoans    = useMemo(() => loans.filter((l) => l.status === "active"), [loans])

  const totalAccounts = useMemo(() => activeAccounts.reduce((s, a) => s + a.balance, 0), [activeAccounts])
  const totalSavings  = useMemo(() => activeGoals.reduce((s, g) => s + g.current_amount, 0), [activeGoals])
  const totalLoans    = useMemo(() => activeLoans.reduce((s, l) => s + l.balance, 0), [activeLoans])

  // Latest period closing_balance for each credit card
  const totalCreditDebt = useMemo(() => {
    let total = 0
    for (const card of creditCards) {
      const periods = creditCardPeriods[card.id] ?? []
      if (periods.length === 0) continue
      const latest = periods.reduce((best, p) =>
        new Date(p.period_date) > new Date(best.period_date) ? p : best
      )
      total += latest.closing_balance
    }
    return total
  }, [creditCards, creditCardPeriods])

  const totalAssets      = totalAccounts + totalSavings
  const totalLiabilities = totalLoans + totalCreditDebt
  const netWorth         = totalAssets - totalLiabilities

  const pieData = [
    { name: "assets",      value: totalAssets,      fill: "oklch(0.627 0.194 149.214)" },
    { name: "liabilities", value: totalLiabilities, fill: "oklch(0.637 0.237 25.331)" },
  ].filter((d) => d.value > 0)

  return (
    <div className="p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-4 px-6 py-5 border-b">
          <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
            <Scale className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t("netWorthTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("netWorthSubtitle")}</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3">
          <div className="px-6 py-5 bg-green-500/5">
            <p className="text-xs font-semibold tracking-widest text-green-600 dark:text-green-500 uppercase mb-2">
              {t("totalAssets")}
            </p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-500">{fmt(totalAssets)}</p>
          </div>
          <div className="px-6 py-5 bg-red-500/5 border-x">
            <p className="text-xs font-semibold tracking-widest text-red-600 dark:text-red-500 uppercase mb-2">
              {t("totalLiabilities")}
            </p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-500">{fmt(totalLiabilities)}</p>
          </div>
          <div className={`px-6 py-5 ${netWorth >= 0 ? "bg-blue-500/5" : "bg-red-500/5"}`}>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
              {t("netWorthLabel")}
            </p>
            <div className="flex items-center gap-2">
              {netWorth >= 0
                ? <TrendingUp className="size-6 text-blue-500" />
                : <TrendingDown className="size-6 text-red-500" />}
              <p className={`text-3xl font-bold ${netWorth >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-500"}`}>
                {fmt(Math.abs(netWorth))}
              </p>
            </div>
          </div>
        </div>
      </div>

      <PremiumGate isPro={isPro} featureName={t("netWorthTitle")}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Donut chart */}
          <div className="rounded-xl border bg-card p-6">
            <p className="font-semibold mb-1">{t("distribution")}</p>
            <p className="text-xs text-muted-foreground mb-4">{t("assetsVsLiabilities")}</p>
            {pieData.length === 0 ? (
              <div className="h-52 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">{t("noData")}</p>
              </div>
            ) : (
              <ChartContainer config={pieConfig} className="h-52 w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(Number(v))} />} />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="70%"
                    paddingAngle={3}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-green-500 shrink-0" />
                <span className="text-xs text-muted-foreground">{t("assetsLabel", { amount: fmt(totalAssets) })}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-red-500 shrink-0" />
                <span className="text-xs text-muted-foreground">{t("liabilitiesLabel", { amount: fmt(totalLiabilities) })}</span>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="flex flex-col gap-4">

            {/* Assets */}
            <div className="rounded-xl border bg-card p-6">
              <p className="font-semibold text-green-600 dark:text-green-500 mb-4 flex items-center gap-2">
                <TrendingUp className="size-4" /> {t("assets")}
              </p>

              <div className="space-y-3">
                {/* Accounts */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wallet className="size-4" />
                    <span>{t("accountsCount", { count: activeAccounts.length })}</span>
                  </div>
                  <span className="text-sm font-semibold">{fmt(totalAccounts)}</span>
                </div>
                {activeAccounts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between pl-6">
                    <span className="text-xs text-muted-foreground">{a.name}</span>
                    <span className="text-xs font-medium">{fmt(a.balance)}</span>
                  </div>
                ))}

                {/* Savings */}
                {activeGoals.length > 0 && (
                  <>
                    <div className="flex items-center justify-between pt-1 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <PiggyBank className="size-4" />
                        <span>{t("savingGoalsCount", { count: activeGoals.length })}</span>
                      </div>
                      <span className="text-sm font-semibold">{fmt(totalSavings)}</span>
                    </div>
                    {activeGoals.map((g) => (
                      <div key={g.id} className="flex items-center justify-between pl-6">
                        <span className="text-xs text-muted-foreground">{g.name}</span>
                        <span className="text-xs font-medium">{fmt(g.current_amount)}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t font-bold text-green-600 dark:text-green-500">
                <span className="text-sm">{t("totalAssetsLabel")}</span>
                <span>{fmt(totalAssets)}</span>
              </div>
            </div>

            {/* Liabilities */}
            <div className="rounded-xl border bg-card p-6">
              <p className="font-semibold text-red-600 dark:text-red-500 mb-4 flex items-center gap-2">
                <TrendingDown className="size-4" /> {t("liabilities")}
              </p>

              <div className="space-y-3">
                {/* Loans */}
                {activeLoans.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Landmark className="size-4" />
                        <span>{t("loansCount", { count: activeLoans.length })}</span>
                      </div>
                      <span className="text-sm font-semibold">{fmt(totalLoans)}</span>
                    </div>
                    {activeLoans.map((l) => (
                      <div key={l.id} className="flex items-center justify-between pl-6">
                        <span className="text-xs text-muted-foreground">{l.name}</span>
                        <span className="text-xs font-medium">{fmt(l.balance)}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Credit cards */}
                {totalCreditDebt > 0 && (
                  <>
                    <div className={`flex items-center justify-between ${activeLoans.length > 0 ? "pt-1 border-t" : ""}`}>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CreditCard className="size-4" />
                        <span>{t("creditCardsCount", { count: creditCards.length })}</span>
                      </div>
                      <span className="text-sm font-semibold">{fmt(totalCreditDebt)}</span>
                    </div>
                    {creditCards.map((card) => {
                      const periods = creditCardPeriods[card.id] ?? []
                      if (periods.length === 0) return null
                      const latest = periods.reduce((best, p) =>
                        new Date(p.period_date) > new Date(best.period_date) ? p : best
                      )
                      if (latest.closing_balance <= 0) return null
                      return (
                        <div key={card.id} className="flex items-center justify-between pl-6">
                          <span className="text-xs text-muted-foreground">{card.alias}</span>
                          <span className="text-xs font-medium">{fmt(latest.closing_balance)}</span>
                        </div>
                      )
                    })}
                  </>
                )}

                {totalLiabilities === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">{t("noActiveDebts")}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t font-bold text-red-600 dark:text-red-500">
                <span className="text-sm">{t("totalLiabilitiesLabel")}</span>
                <span>{fmt(totalLiabilities)}</span>
              </div>
            </div>

          </div>
        </div>
      </PremiumGate>
    </div>
  )
}
