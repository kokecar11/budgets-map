"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Plus, Trash2, CheckCircle2, Circle, Copy, Link } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

import { useTranslations } from "next-intl"
import { BudgetItemForm } from "./budget-item-form"
import { LinkTransactionDialog } from "./link-transaction-dialog"
import { budgetItemApi } from "./api"
import type { BudgetItem, Budget } from "./types"
import type { Category } from "@/features/categories/types"
import type { Transaction } from "@/features/transactions/types"
import type { Account } from "@/features/accounts/types"

interface BudgetItemsListProps {
  budgetId: string
  initialItems: BudgetItem[]
  previousBudgetId?: string
  categories: Category[]
  transactions: Transaction[]
  budget: Budget
  accounts: Account[]
}

export function BudgetItemsList({ budgetId, initialItems, previousBudgetId, categories, transactions, budget, accounts }: BudgetItemsListProps) {
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))
  const { data: session } = useSession()
  const t = useTranslations("budgets")
  const tCommon = useTranslations("common")
  const [items, setItems] = useState<BudgetItem[]>(initialItems)
  const [openForm, setOpenForm] = useState(false)
  const [copying, setCopying] = useState(false)
  const [linkTarget, setLinkTarget] = useState<BudgetItem | null>(null)

  const total = items.reduce((sum, item) => sum + item.planned_amount, 0)
  const paid = items.filter((i) => i.is_paid).reduce((sum, item) => sum + item.planned_amount, 0)

  function handleCreated(item: BudgetItem) {
    setItems((prev) => [...prev, item])
    setOpenForm(false)
  }

  async function handleDelete(id: string) {
    try {
      await budgetItemApi.delete(id, session?.accessToken ?? "")
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success(t("itemDeleted"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorDeletingItem"))
    }
  }

  async function handleCopyFromPrevious() {
    if (!previousBudgetId) return
    if (items.length > 0 && !window.confirm(t("confirmCopy"))) return
    setCopying(true)
    try {
      const token = session?.accessToken ?? ""
      const prevItems = await budgetItemApi.list(previousBudgetId, token)
      const created = await Promise.all(
        prevItems.map((item) =>
          budgetItemApi.create(
            budgetId,
            {
              description: item.description,
              planned_amount: item.planned_amount,
              category_id: item.category_id || undefined,
              is_paid: false,
            },
            token
          )
        )
      )
      setItems((prev) => [...prev, ...created])
      toast.success(t("itemsCopied"))
    } catch {
      toast.error(t("errorCopying"))
    } finally {
      setCopying(false)
    }
  }

  async function handleTogglePaid(item: BudgetItem) {
    const updated = await budgetItemApi.update(
      item.id,
      { is_paid: !item.is_paid },
      session?.accessToken ?? ""
    )
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
  }

  async function handleLink(item: BudgetItem, transactionId: string | null) {
    try {
      const updated = await budgetItemApi.update(
        item.id,
        { transaction_id: transactionId },
        session?.accessToken ?? ""
      )
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      toast.success(transactionId ? t("transactionLinked") : t("transactionUnlinked"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorLinking"))
      throw err
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-medium">{t("budgetItems")}</h3>
          <span className="text-muted-foreground text-sm">
            {t("paid")}: <strong>{paid.toLocaleString()}</strong> / {tCommon("total")}:{" "}
            <strong>{total.toLocaleString()}</strong>
          </span>
        </div>
        <div className="flex gap-2">
          {previousBudgetId && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyFromPrevious}
              disabled={copying}
            >
              <Copy className="size-4" />
              {copying ? t("copying") : t("copyPrevious")}
            </Button>
          )}
          <Button size="sm" onClick={() => setOpenForm(true)}>
            <Plus className="size-4" />
            {t("addItem")}
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t("noItems")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <button
                  onClick={() => handleTogglePaid(item)}
                  className="text-muted-foreground hover:text-primary shrink-0"
                >
                  {item.is_paid ? (
                    <CheckCircle2 className="size-5 text-green-500" />
                  ) : (
                    <Circle className="size-5" />
                  )}
                </button>
                <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                  <div className="min-w-0">
                    <span className={`text-sm truncate ${item.is_paid ? "line-through text-muted-foreground" : ""}`}>
                      {item.description}
                    </span>
                    {item.category_id && categoryMap[item.category_id] && (
                      <p className="text-xs text-muted-foreground">{categoryMap[item.category_id]}</p>
                    )}
                    {item.actual_amount != null && (
                      <p className="text-xs text-muted-foreground">
                        {t("real")}: <strong>{item.actual_amount.toLocaleString()}</strong>
                        {item.difference != null && (
                          <span className={item.difference >= 0 ? " text-green-600" : " text-red-600"}>
                            {" "}({item.difference >= 0 ? "+" : ""}{item.difference.toLocaleString()})
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-medium shrink-0">
                    {item.planned_amount.toLocaleString()}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary shrink-0 h-7 w-7"
                  onClick={() => setLinkTarget(item)}
                >
                  <Link className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive shrink-0 h-7 w-7"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialogTitleNewItem")}</DialogTitle>
            <DialogDescription>{t("dialogDescNewItem")}</DialogDescription>
          </DialogHeader>
          <BudgetItemForm
            budgetId={budgetId}
            categories={categories}
            onSuccess={handleCreated}
            onCancel={() => setOpenForm(false)}
          />
        </DialogContent>
      </Dialog>

      {linkTarget && (
        <LinkTransactionDialog
          open={!!linkTarget}
          onOpenChange={(open) => { if (!open) setLinkTarget(null) }}
          item={linkTarget}
          transactions={transactions}
          budget={budget}
          accounts={accounts}
          categories={categories}
          onLink={handleLink}
        />
      )}
    </div>
  )
}
