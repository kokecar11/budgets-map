"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { useFinancialRules } from "@/contexts/financial-rules-context"
import { financialRulesApi } from "@/features/financial-rules/api"
import type { ExpenseModel } from "@/features/financial-rules/types"

export default function FinancialRulesPage() {
  const { data: session } = useSession()
  const t = useTranslations("financial")
  const { rules, setRules } = useFinancialRules()
  const [saving, setSaving] = useState(false)

  const options: { value: ExpenseModel; label: string; desc: string }[] = [
    { value: "accrual", label: t("modelAccrual"), desc: t("modelAccrualDesc") },
    { value: "cash", label: t("modelCash"), desc: t("modelCashDesc") },
  ]

  async function selectModel(model: ExpenseModel) {
    if (model === rules.expense_model || saving) return
    setSaving(true)
    try {
      const updated = await financialRulesApi.update(
        { expense_model: model },
        session?.accessToken ?? ""
      )
      setRules(updated)
      toast.success(t("modelSaved"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorSaving"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 className="text-base font-semibold mb-1">{t("expenseModel")}</h2>
      <p className="text-sm text-muted-foreground mb-4">{t("subtitle")}</p>
      <div className="flex flex-col gap-3">
        {options.map((opt) => {
          const active = rules.expense_model === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => selectModel(opt.value)}
              disabled={saving}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors disabled:opacity-60 ${
                active ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40"
              }`}
            >
              <div className={`mt-0.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground/40"}`}>
                <CheckCircle2 className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
