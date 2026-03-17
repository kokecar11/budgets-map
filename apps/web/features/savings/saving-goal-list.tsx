"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Plus, Trash2, Target, TrendingUp, MoreVertical } from "lucide-react"
import { toast } from "sonner"

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

const STATUS_LABELS = {
  active: "Activa",
  completed: "Completada",
  cancelled: "Cancelada",
}

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
  const [goals, setGoals] = useState<SavingGoal[]>(initialGoals)
  const [openForm, setOpenForm] = useState(false)

  function handleCreated(goal: SavingGoal) {
    setGoals((prev) => [goal, ...prev])
    setOpenForm(false)
  }

  async function handleDelete(id: string) {
    try {
      await savingGoalApi.delete(id, session?.accessToken ?? "")
      setGoals((prev) => prev.filter((g) => g.id !== id))
      toast.success("Meta eliminada")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar la meta")
    }
  }

  const fmt = (n: number) => n.toLocaleString("es-MX", { minimumFractionDigits: 0 })

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
              <h1 className="text-xl font-bold">Metas de Ahorro</h1>
              <p className="text-sm text-muted-foreground">Alcanza tus objetivos financieros</p>
            </div>
          </div>
          <Button onClick={() => setOpenForm(true)}>
            <Plus className="size-4" />
            Nueva meta
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3">
          <div className="px-6 py-5">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">Total ahorrado</p>
            <p className="text-3xl font-bold">$ {fmt(totalSaved)}</p>
          </div>
          <div className="px-6 py-5 bg-primary/5 border-x">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-2">Metas activas</p>
            <p className="text-3xl font-bold text-primary">{activeGoals.length}</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">Completadas</p>
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
            <p className="font-semibold">Todas las Metas</p>
            <p className="text-xs text-muted-foreground">{goals.length} metas registradas</p>
          </div>
        </div>

        {goals.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-16">
            No tienes metas de ahorro. Crea una para empezar.
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
                        {STATUS_LABELS[goal.status]}
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
                      {goal.deadline ? ` · Hasta ${new Date(goal.deadline).toLocaleDateString("es-MX")}` : ""}
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
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(goal.id)}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Eliminar
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
            <DialogTitle>Nueva meta de ahorro</DialogTitle>
            <DialogDescription>Define el monto objetivo y la fecha límite de tu meta.</DialogDescription>
          </DialogHeader>
          <SavingGoalForm
            onSuccess={handleCreated}
            onCancel={() => setOpenForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
