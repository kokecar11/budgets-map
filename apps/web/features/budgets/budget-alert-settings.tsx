"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Bell, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { useTranslations } from "next-intl"
import { budgetApi } from "./api"
import type { Budget } from "./types"

interface BudgetAlertSettingsProps {
  budget: Budget
}

export function BudgetAlertSettings({ budget }: BudgetAlertSettingsProps) {
  const { data: session } = useSession()
  const t = useTranslations("budgets")
  const tCommon = useTranslations("common")
  const [warningPct, setWarningPct] = useState(budget.alert_warning_pct)
  const [dangerPct, setDangerPct] = useState(budget.alert_danger_pct)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const w = Math.min(Math.max(Number(warningPct), 1), 99)
    const d = Math.min(Math.max(Number(dangerPct), w + 1), 200)
    setWarningPct(w)
    setDangerPct(d)
    setSaving(true)
    try {
      await budgetApi.update(budget.id, { alert_warning_pct: w, alert_danger_pct: d }, session?.accessToken ?? "")
      toast.success(t("limitsSaved"))
    } catch {
      toast.error(t("errorSavingLimits"))
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    setWarningPct(80)
    setDangerPct(100)
    setSaving(true)
    try {
      await budgetApi.update(budget.id, { alert_warning_pct: 80, alert_danger_pct: 100 }, session?.accessToken ?? "")
      toast.success(t("limitsReset"))
    } catch {
      toast.error(t("errorResetting"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b bg-muted/30">
        <Bell className="size-4 text-muted-foreground shrink-0" />
        <p className="text-sm font-semibold">{t("alertLimits")}</p>
        <span className="ml-auto text-xs text-muted-foreground">{t("appliesOnDashboard")}</span>
      </div>

      <div className="px-5 py-4 flex flex-col gap-4">
        <p className="text-xs text-muted-foreground">
          {t("alertDescription")}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full bg-yellow-400" />
              {t("yellowAlert")}
            </label>
            <Input
              type="number"
              min={1}
              max={99}
              value={warningPct}
              onChange={(e) => setWarningPct(Number(e.target.value))}
              className="h-8 text-sm"
            />
            <p className="text-[11px] text-muted-foreground">{t("yellowRange")}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full bg-red-500" />
              {t("redAlert")}
            </label>
            <Input
              type="number"
              min={warningPct + 1}
              max={200}
              value={dangerPct}
              onChange={(e) => setDangerPct(Number(e.target.value))}
              className="h-8 text-sm"
            />
            <p className="text-[11px] text-muted-foreground">{t("redMustBeHigher")}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-1.5 h-8"
            onClick={handleReset}
            disabled={saving}
          >
            <RotateCcw className="size-3.5" />
            {t("resetLimits")}
          </Button>
          <Button type="button" size="sm" className="h-8" onClick={handleSave} disabled={saving}>
            {saving ? tCommon("saving") : t("saveLimits")}
          </Button>
        </div>
      </div>
    </div>
  )
}
