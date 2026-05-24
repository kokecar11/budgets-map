"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Plus, LayoutGrid, CalendarDays, ChevronRight, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

import { BudgetForm } from "./budget-form"
import { budgetApi } from "./api"
import type { Budget } from "./types"

interface BudgetListProps {
  initialBudgets: Budget[]
}

export function BudgetList({ initialBudgets }: BudgetListProps) {
  const { data: session } = useSession()
  const t = useTranslations("budgets")
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets)
  const [openForm, setOpenForm] = useState(false)

  function handleCreated(budget: Budget) {
    setBudgets((prev) => [budget, ...prev])
    setOpenForm(false)
  }

  async function handleDelete(id: string) {
    try {
      await budgetApi.delete(id, session?.accessToken ?? "")
      setBudgets((prev) => prev.filter((b) => b.id !== id))
      toast.success(t("budgetDeleted"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorDeleting"))
    }
  }

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const activeBudgets = budgets.filter((b) => b.month === currentMonth && b.year === currentYear)
  const thisYearBudgets = budgets.filter((b) => b.year === currentYear)

  return (
    <div className="flex flex-col gap-6">

      {/* Header section */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Title + button */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
              <LayoutGrid className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t("title")}</h1>
              <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
          <Button onClick={() => setOpenForm(true)}>
            <Plus className="size-4" />
            {t("newBudget")}
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3">
          <div className="px-6 py-5">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">{t("totalBudgets")}</p>
            <p className="text-3xl font-bold">{budgets.length}</p>
          </div>
          <div className="px-6 py-5 bg-red-500/5 border-x">
            <p className="text-xs font-semibold tracking-widest text-red-600 dark:text-red-500 uppercase mb-2">{t("thisYear")}</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-500">{thisYearBudgets.length}</p>
          </div>
          <div className="px-6 py-5 bg-primary/5">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-2">{t("activeBudgets")}</p>
            <p className="text-3xl font-bold text-primary">{activeBudgets.length}</p>
          </div>
        </div>
      </div>

      {/* Budget list section */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Section header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b">
          <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
            <CalendarDays className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">{t("allBudgets")}</p>
            <p className="text-xs text-muted-foreground">{t("countRegistered", { count: budgets.length })}</p>
          </div>
        </div>

        {budgets.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-16">
            {t("noBudgets")}
          </p>
        ) : (
          <div className="divide-y">
            {budgets.map((budget) => (
              <div key={budget.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group">
                <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
                  <LayoutGrid className="size-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{budget.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs h-5">
                      {t(`months.${budget.month}`)} {budget.year}
                    </Badge>
                    {budget.description && (
                      <span className="text-xs text-muted-foreground truncate">{budget.description}</span>
                    )}
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(budget.id)}
                >
                  <Trash2 className="size-4" />
                </Button>

                <Link href={`/budgets/${budget.id}`}>
                  <ChevronRight className="size-5 text-muted-foreground shrink-0" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialogTitleNew")}</DialogTitle>
            <DialogDescription>{t("dialogDescNew")}</DialogDescription>
          </DialogHeader>
          <BudgetForm
            onSuccess={handleCreated}
            onCancel={() => setOpenForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
