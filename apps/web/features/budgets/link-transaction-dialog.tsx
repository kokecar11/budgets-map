"use client"

import { useState } from "react"
import { Unlink } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { SearchSelect } from "@workspace/ui/components/search-select"

import type { BudgetItem, Budget } from "./types"
import type { Transaction } from "@/features/transactions/types"

interface LinkTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: BudgetItem
  transactions: Transaction[]
  budget: Budget
  onLink: (item: BudgetItem, transactionId: string | null) => Promise<void>
}

export function LinkTransactionDialog({
  open,
  onOpenChange,
  item,
  transactions,
  budget,
  onLink,
}: LinkTransactionDialogProps) {
  const t = useTranslations("budgets")
  const tCommon = useTranslations("common")
  const [selectedId, setSelectedId] = useState<string>(item.transaction_id ?? "")
  const [loading, setLoading] = useState(false)

  // Filter: same month+year as budget, type=expense
  const eligible = transactions.filter((t) => {
    const date = new Date(t.date)
    return (
      t.type === "expense" &&
      date.getMonth() + 1 === budget.month &&
      date.getFullYear() === budget.year
    )
  })

  const options = eligible.map((tx) => ({
    value: tx.id,
    label: `${tx.description ?? tCommon("noData")} — $${tx.amount.toLocaleString()} (${new Date(tx.date).toLocaleDateString()})`,
  }))

  async function handleLink() {
    if (!selectedId) return
    setLoading(true)
    try {
      await onLink(item, selectedId)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleUnlink() {
    setLoading(true)
    try {
      await onLink(item, null)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("linkTransaction")}</DialogTitle>
          <DialogDescription>
            {t("linkDesc", { month: budget.month, year: budget.year, item: item.description })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          <SearchSelect
            value={selectedId}
            onValueChange={setSelectedId}
            options={options}
            placeholder={t("selectTransaction")}
            searchPlaceholder={t("searchTransaction")}
            emptyText={t("noExpenses")}
          />

          <div className="flex justify-between gap-2">
            {item.transaction_id && (
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={handleUnlink}
                disabled={loading}
              >
                <Unlink className="size-4" />
                {t("unlink")}
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleLink}
                disabled={!selectedId || loading}
              >
                {loading ? t("linking") : t("link")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
