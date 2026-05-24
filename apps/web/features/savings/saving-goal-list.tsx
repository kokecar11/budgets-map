"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Plus, Trash2, Target, TrendingUp, MoreVertical, Pencil, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { useLocale, useTranslations } from "next-intl"
import { LOCALE_TAG } from "@/lib/dates"
import type { Locale } from "@/i18n/routing"
import { useCurrency } from "@/hooks/use-currency"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Progress } from "@workspace/ui/components/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { SavingGoalForm } from "./saving-goal-form"
import { savingGoalApi } from "./api"
import type { SavingGoal } from "./types"

const STATUS_BADGE: Record<SavingGoal["status"], string> = {
  active: "bg-green-600/10 text-green-600 border-green-600/20 dark:bg-green-500/10 dark:text-green-400",
  completed: "bg-blue-600/10 text-blue-600 border-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400",
  cancelled: "bg-muted text-muted-foreground",
}

interface SavingGoalListProps {
  initialGoals: SavingGoal[]
}

export function SavingGoalList({ initialGoals }: SavingGoalListProps) {
  const { data: session } = useSession()
  const locale = useLocale() as Locale
  const t = useTranslations("savings")
  const [goals, setGoals] = useState<SavingGoal[]>(initialGoals)
  const [openForm, setOpenForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null)

  function handleCreated(goal: SavingGoal) {
    setGoals((prev) => [goal, ...prev])
    setOpenForm(false)
  }

  function handleUpdated(goal: SavingGoal) {
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)))
    setEditingGoal(null)
  }

  async function handleSetStatus(id: string, status: SavingGoal["status"]) {
    try {
      const updated = await savingGoalApi.update(id, { status }, session?.accessToken ?? "")
      setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
      toast.success(status === "completed" ? t("goalCompleted") : t("goalCancelled"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorUpdating"))
    }
  }

  async function handleDelete(id: string) {
    try {
      await savingGoalApi.delete(id, session?.accessToken ?? "")
      setGoals((prev) => prev.filter((g) => g.id !== id))
      toast.success(t("goalDeleted"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorDeleting"))
    }
  }

  const fmt = useCurrency()

  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0)
  const activeGoals = goals.filter((g) => g.status === "active")
  const completedGoals = goals.filter((g) => g.status === "completed")

  return (
    <div className="flex flex-col gap-6">

      {/* Header section */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Title + button */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
              <Target className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t("title")}</h1>
              <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
          <Button onClick={() => setOpenForm(true)}>
            <Plus className="size-4" />
            {t("newGoal")}
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3">
          <div className="px-6 py-5">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">{t("totalSaved")}</p>
            <p className="text-3xl font-bold">$ {fmt(totalSaved)}</p>
          </div>
          <div className="px-6 py-5 bg-primary/5 border-x">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-2">{t("activeGoals")}</p>
            <p className="text-3xl font-bold text-primary">{activeGoals.length}</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">{t("completed")}</p>
            <p className="text-3xl font-bold">{completedGoals.length}</p>
          </div>
        </div>
      </div>

      {/* Goals list section */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Section header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b">
          <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
            <TrendingUp className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">{t("allGoals")}</p>
            <p className="text-xs text-muted-foreground">{t("countRegistered", { count: goals.length })}</p>
          </div>
        </div>

        {goals.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-16">
            {t("noGoals")}
          </p>
        ) : (
          <div className="divide-y">
            {goals.map((goal) => {
              const percent = goal.target_amount > 0
                ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
                : 0
              return (
                <div key={goal.id} className="flex items-start gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0 mt-0.5">
                    <Target className="size-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{goal.name}</p>
                      <Badge className={`text-xs h-5 ${STATUS_BADGE[goal.status]}`}>
                        {t(`status${goal.status.charAt(0).toUpperCase()}${goal.status.slice(1)}` as "statusActive" | "statusCompleted" | "statusCancelled")}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <Progress
                        value={percent}
                        className="flex-1 h-2 [&>div]:bg-primary"
                      />
                      <span className="text-xs text-muted-foreground w-8 text-right shrink-0">
                        {percent}%
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                      $ {fmt(goal.current_amount)} de $ {fmt(goal.target_amount)}
                      {goal.deadline ? ` · ${t("deadline", { date: new Date(goal.deadline).toLocaleDateString(LOCALE_TAG[locale]) })}` : ""}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingGoal(goal)}>
                        <Pencil className="size-4 mr-2" />
                        {t("editGoal")}
                      </DropdownMenuItem>
                      {goal.status === "active" && (
                        <>
                          <DropdownMenuItem onClick={() => handleSetStatus(goal.id, "completed")}>
                            <CheckCircle2 className="size-4 mr-2 text-green-500" />
                            {t("markCompleted")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSetStatus(goal.id, "cancelled")}>
                            <XCircle className="size-4 mr-2 text-muted-foreground" />
                            {t("cancelGoal")}
                          </DropdownMenuItem>
                        </>
                      )}
                      {goal.status !== "active" && (
                        <DropdownMenuItem onClick={() => handleSetStatus(goal.id, "active")}>
                          <Target className="size-4 mr-2 text-primary" />
                          {t("reactivateGoal")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(goal.id)}
                      >
                        <Trash2 className="size-4 mr-2" />
                        {t("deleteGoal")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialogTitleNew")}</DialogTitle>
            <DialogDescription>{t("dialogDescNew")}</DialogDescription>
          </DialogHeader>
          <SavingGoalForm
            onSuccess={handleCreated}
            onCancel={() => setOpenForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingGoal)} onOpenChange={(open) => { if (!open) setEditingGoal(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialogTitleEdit")}</DialogTitle>
            <DialogDescription>{t("dialogDescEdit")}</DialogDescription>
          </DialogHeader>
          {editingGoal && (
            <SavingGoalForm
              initialValues={editingGoal}
              onSuccess={handleUpdated}
              onCancel={() => setEditingGoal(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
