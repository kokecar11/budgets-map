"use client"

import { useMemo, useState, useTransition } from "react"
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, XAxis, YAxis, Legend, ReferenceLine,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import { BarChart2, PieChart as PieIcon, TrendingUp, TrendingDown, Minus, FileBarChart } from "lucide-react"
import { PremiumGate } from "@/components/premium-gate"
import { reportsApi } from "./api"
import type { MonthlyStat, CategoryStat } from "./types"
import type { Category } from "@/features/categories/types"

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

const DEFAULT_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
]

const areaConfig = {
  income:   { label: "Ingresos", color: "var(--color-income)" },
  expenses: { label: "Gastos",   color: "var(--color-expenses)" },
} satisfies ChartConfig

interface ReportsContentProps {
  token: string
  isPro: boolean
  initialYear: number
  initialMonthlyStats: MonthlyStat[]
  initialCategoryStats: CategoryStat[]
  categories: Category[]
}

export function ReportsContent({
  token, isPro, initialYear, initialMonthlyStats, initialCategoryStats, categories,
}: ReportsContentProps) {
  const [year, setYear] = useState(initialYear)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [monthlyStats, setMonthlyStats] = useState(initialMonthlyStats)
  const [categoryStats, setCategoryStats] = useState(initialCategoryStats)
  const [categoryChartType, setCategoryChartType] = useState<"bar" | "pie">("bar")
  const [isPending, startTransition] = useTransition()

  const categoryColorMap = Object.fromEntries(
    categories.map((c, i) => [c.id, c.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]])
  )
  const categoryNameMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  const currentYear = new Date().getFullYear()
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1].filter(
    (y) => y <= currentYear
  )

  function handleYearChange(y: number) {
    setYear(y)
    setSelectedMonth(null)
    startTransition(async () => {
      const [ms, cs] = await Promise.allSettled([
        reportsApi.monthlyStats(token, y),
        reportsApi.categoryStats(token, y),
      ])
      if (ms.status === "fulfilled") setMonthlyStats(ms.value.stats)
      if (cs.status === "fulfilled") setCategoryStats(cs.value.stats)
    })
  }

  function handleMonthChange(m: number | null) {
    setSelectedMonth(m)
    startTransition(async () => {
      const cs = await reportsApi.categoryStats(token, year, m ?? undefined)
      setCategoryStats(cs.stats)
    })
  }

  // Fill all 12 months even if backend omits months with 0
  const monthlyData = useMemo(() => {
    const map = Object.fromEntries(monthlyStats.map((s) => [s.month, s]))
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      const s = map[m]
      return {
        label: MONTH_NAMES[i],
        income: s?.income ?? 0,
        expenses: s?.expenses ?? 0,
        net: s?.net ?? 0,
      }
    })
  }, [monthlyStats])

  const categoryData = useMemo(() => {
    return categoryStats
      .map((s, i) => ({
        name: s.category_id ? (categoryNameMap[s.category_id] ?? "Otra") : "Sin categoría",
        amount: s.total,
        count: s.count,
        color: s.category_id
          ? (categoryColorMap[s.category_id] ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length])
          : "#94a3b8",
      }))
      .slice(0, 8)
  }, [categoryStats, categoryNameMap, categoryColorMap])

  const catConfig = useMemo(() => {
    const cfg: ChartConfig = {}
    categoryData.forEach((c) => { cfg[c.name] = { label: c.name, color: c.color } })
    return cfg
  }, [categoryData])

  const totalIncome   = monthlyStats.reduce((s, m) => s + m.income, 0)
  const totalExpenses = monthlyStats.reduce((s, m) => s + m.expenses, 0)
  const totalNet      = totalIncome - totalExpenses
  const savingsRate   = totalIncome > 0 ? Math.round((totalNet / totalIncome) * 100) : 0

  const fmt = (n: number) => `$ ${n.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`

  return (
    <div className="p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
              <FileBarChart className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Reportes financieros</h1>
              <p className="text-sm text-muted-foreground">Análisis anual de tus finanzas</p>
            </div>
          </div>

          {/* Year selector */}
          <div className="flex items-center gap-1 border rounded-lg p-0.5">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => handleYearChange(y)}
                disabled={isPending}
                className={`h-8 px-3 rounded-md text-sm font-medium transition-colors ${
                  y === year
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4">
          <div className="px-6 py-5 bg-green-500/5">
            <p className="text-xs font-semibold tracking-widest text-green-600 dark:text-green-500 uppercase mb-2">
              Total ingresos
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-500">{fmt(totalIncome)}</p>
          </div>
          <div className="px-6 py-5 bg-red-500/5 border-l">
            <p className="text-xs font-semibold tracking-widest text-red-600 dark:text-red-500 uppercase mb-2">
              Total gastos
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-500">{fmt(totalExpenses)}</p>
          </div>
          <div className={`px-6 py-5 border-l ${totalNet >= 0 ? "bg-blue-500/5" : "bg-red-500/5"}`}>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
              Balance neto
            </p>
            <div className="flex items-center gap-2">
              {totalNet >= 0
                ? <TrendingUp className="size-5 text-blue-500" />
                : <TrendingDown className="size-5 text-red-500" />}
              <p className={`text-2xl font-bold ${totalNet >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-500"}`}>
                {fmt(Math.abs(totalNet))}
              </p>
            </div>
          </div>
          <div className="px-6 py-5 border-l">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
              Tasa de ahorro
            </p>
            <div className="flex items-center gap-2">
              {savingsRate > 20
                ? <TrendingUp className="size-5 text-green-500" />
                : savingsRate > 0
                ? <Minus className="size-5 text-yellow-500" />
                : <TrendingDown className="size-5 text-red-500" />}
              <p className={`text-2xl font-bold ${savingsRate > 20 ? "text-green-600 dark:text-green-500" : savingsRate > 0 ? "text-yellow-600" : "text-red-500"}`}>
                {savingsRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <PremiumGate isPro={isPro} featureName="Reportes financieros">
        <div className="flex flex-col gap-6">

          {/* Income vs Expenses area chart */}
          <div className="rounded-xl border bg-card p-6">
            <p className="font-semibold mb-1">Ingresos vs Gastos</p>
            <p className="text-xs text-muted-foreground mb-4">Todos los meses del año {year}</p>
            <ChartContainer
              config={areaConfig}
              className="h-64 w-full"
              style={{
                "--color-income":   "oklch(0.627 0.194 149.214)",
                "--color-expenses": "oklch(0.637 0.237 25.331)",
              } as React.CSSProperties}
            >
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="fillIncomeR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--color-income)"   stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-income)"   stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillExpensesR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--color-expenses)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(Number(v))} />} />
                <Area dataKey="income"   type="monotone" stroke="var(--color-income)"   strokeWidth={2} fill="url(#fillIncomeR)" />
                <Area dataKey="expenses" type="monotone" stroke="var(--color-expenses)" strokeWidth={2} fill="url(#fillExpensesR)" />
              </AreaChart>
            </ChartContainer>
          </div>

          {/* Net balance bar chart */}
          <div className="rounded-xl border bg-card p-6">
            <p className="font-semibold mb-1">Balance mensual neto</p>
            <p className="text-xs text-muted-foreground mb-4">Ingresos menos gastos por mes</p>
            <ChartContainer
              config={{ net: { label: "Balance", color: "var(--color-net)" } }}
              className="h-52 w-full"
              style={{ "--color-net": "oklch(0.546 0.245 262.881)" } as React.CSSProperties}
            >
              <BarChart data={monthlyData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <ReferenceLine y={0} className="stroke-border" />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(Number(v))} />} />
                <Bar dataKey="net" radius={4}>
                  {monthlyData.map((entry) => (
                    <Cell
                      key={entry.label}
                      fill={entry.net >= 0 ? "oklch(0.627 0.194 149.214)" : "oklch(0.637 0.237 25.331)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>

          {/* Top spending categories */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold">Gastos por categoría</p>
              <div className="flex items-center gap-2">
                {/* Month filter */}
                <div className="flex items-center gap-1 border rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => handleMonthChange(null)}
                    disabled={isPending}
                    className={`h-7 px-2 rounded-md text-xs font-medium transition-colors ${selectedMonth === null ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Año
                  </button>
                  {MONTH_NAMES.map((name, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleMonthChange(i + 1)}
                      disabled={isPending}
                      className={`h-7 px-2 rounded-md text-xs font-medium transition-colors ${selectedMonth === i + 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                {/* Chart type toggle */}
                <div className="flex items-center gap-1 border rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setCategoryChartType("bar")}
                    className={`p-1.5 rounded-md transition-colors ${categoryChartType === "bar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <BarChart2 className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryChartType("pie")}
                    className={`p-1.5 rounded-md transition-colors ${categoryChartType === "pie" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <PieIcon className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {selectedMonth !== null
                ? `Gastos de ${MONTH_NAMES[selectedMonth - 1]} ${year}`
                : `Top gastos del año ${year}`}
            </p>

            {categoryData.length === 0 ? (
              <div className="h-52 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Sin gastos registrados</p>
              </div>
            ) : categoryChartType === "bar" ? (
              <ChartContainer config={catConfig} className="h-64 w-full">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(Number(v))} />} />
                  <Bar dataKey="amount" radius={4}>
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <ChartContainer config={catConfig} className="h-64 w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" formatter={(v) => fmt(Number(v))} />} />
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="35%"
                    outerRadius="65%"
                    paddingAngle={2}
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-[11px]">{value}</span>}
                  />
                </PieChart>
              </ChartContainer>
            )}
          </div>

        </div>
      </PremiumGate>
    </div>
  )
}
