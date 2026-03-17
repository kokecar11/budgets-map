"use client"

import { useMemo, useState } from "react"
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, XAxis, YAxis, Legend,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import { BarChart2, PieChart as PieIcon } from "lucide-react"
import type { Transaction } from "@/features/transactions/types"
import type { Category } from "@/features/categories/types"

interface TrendChartsProps {
  transactions: Transaction[]
  categories: Category[]
}

const DEFAULT_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#3b82f6", "#8b5cf6",
]

const areaConfig = {
  income:  { label: "Ingresos", color: "var(--color-income)" },
  expense: { label: "Gastos",   color: "var(--color-expense)" },
} satisfies ChartConfig

function shortMonth(date: Date) {
  return date.toLocaleDateString("es-MX", { month: "short" })
}

type CategoryChartType = "bar" | "pie"

export function TrendCharts({ transactions, categories }: TrendChartsProps) {
  const [categoryChartType, setCategoryChartType] = useState<CategoryChartType>("bar")

  const categoryColorMap = Object.fromEntries(
    categories.map((c, i) => [c.id, c.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]])
  )
  const categoryNameMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  // Last 6 months: income vs expense
  const monthlyData = useMemo(() => {
    const now = new Date()
    const months: { label: string; income: number; expense: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ label: shortMonth(d), income: 0, expense: 0 })
    }
    for (const tx of transactions) {
      const d = new Date(tx.date)
      const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
      if (diff < 0 || diff > 5) continue
      const idx = 5 - diff
      if (tx.type === "income")  months[idx].income  += tx.amount
      if (tx.type === "expense") months[idx].expense += tx.amount
    }
    return months
  }, [transactions])

  // Top 6 spending categories this month — with color
  const categoryData = useMemo(() => {
    const now = new Date()
    const map: Record<string, number> = {}
    for (const tx of transactions) {
      if (tx.type !== "expense" || !tx.category_id) continue
      const d = new Date(tx.date)
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) continue
      map[tx.category_id] = (map[tx.category_id] ?? 0) + tx.amount
    }
    return Object.entries(map)
      .map(([id, amount], i) => ({
        name:   categoryNameMap[id] ?? "Sin categoría",
        amount,
        color:  categoryColorMap[id] ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6)
  }, [transactions, categoryNameMap, categoryColorMap])

  // Dynamic config for bar/pie so ChartTooltipContent gets labels
  const catConfig = useMemo(() => {
    const cfg: ChartConfig = {}
    categoryData.forEach((c) => { cfg[c.name] = { label: c.name, color: c.color } })
    return cfg
  }, [categoryData])

  const fmt = (n: number) =>
    `$ ${n.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ── Ingresos vs Gastos ── */}
      <div className="rounded-xl border bg-card p-6">
        <p className="font-semibold mb-1">Ingresos vs Gastos</p>
        <p className="text-xs text-muted-foreground mb-4">Últimos 6 meses</p>
        <ChartContainer
          config={areaConfig}
          className="h-52 w-full"
          style={{
            "--color-income":  "oklch(0.627 0.194 149.214)",
            "--color-expense": "oklch(0.637 0.237 25.331)",
          } as React.CSSProperties}
        >
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--color-income)"  stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-income)"  stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--color-expense)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(Number(v))} />} />
            <Area dataKey="income"  type="monotone" stroke="var(--color-income)"  strokeWidth={2} fill="url(#fillIncome)" />
            <Area dataKey="expense" type="monotone" stroke="var(--color-expense)" strokeWidth={2} fill="url(#fillExpense)" />
          </AreaChart>
        </ChartContainer>
      </div>

      {/* ── Gastos por categoría ── */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold">Gastos por categoría</p>
          <div className="flex items-center gap-1 border rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setCategoryChartType("bar")}
              className={`p-1.5 rounded-md transition-colors ${categoryChartType === "bar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="Barras"
            >
              <BarChart2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCategoryChartType("pie")}
              className={`p-1.5 rounded-md transition-colors ${categoryChartType === "pie" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="Torta"
            >
              <PieIcon className="size-3.5" />
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Mes actual</p>

        {categoryData.length === 0 ? (
          <div className="h-52 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Sin gastos este mes</p>
          </div>
        ) : categoryChartType === "bar" ? (
          <ChartContainer config={catConfig} className="h-52 w-full">
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
                width={90}
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
          <ChartContainer config={catConfig} className="h-52 w-full">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="name"
                    formatter={(v) => fmt(Number(v))}
                  />
                }
              />
              <Pie
                data={categoryData}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="70%"
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
  )
}
