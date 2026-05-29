"use client"

import { useState, useMemo } from "react"
import { Unlink, CheckIcon, ArrowDownCircle, ArrowUpCircle, CreditCard, SearchIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import type { BudgetItem, Budget } from "./types"
import type { Transaction } from "@/features/transactions/types"
import type { Account } from "@/features/accounts/types"
import type { Category } from "@/features/categories/types"

const LINKABLE_TYPES = ["expense", "credit_card_charge", "income"] as const
type LinkableType = typeof LINKABLE_TYPES[number]

const TYPE_ICONS: Record<LinkableType, React.ElementType> = {
  income: ArrowUpCircle,
  expense: ArrowDownCircle,
  credit_card_charge: CreditCard,
}

const TYPE_ICON_BG: Record<LinkableType, string> = {
  income: "bg-green-500/10",
  expense: "bg-red-500/10",
  credit_card_charge: "bg-orange-500/10",
}

const TYPE_COLORS: Record<LinkableType, string> = {
  income: "text-green-500",
  expense: "text-red-500",
  credit_card_charge: "text-orange-500",
}

interface LinkTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: BudgetItem
  transactions: Transaction[]
  budget: Budget
  accounts: Account[]
  categories: Category[]
  onLink: (item: BudgetItem, transactionId: string | null) => Promise<void>
}

export function LinkTransactionDialog({
  open,
  onOpenChange,
  item,
  transactions,
  budget,
  accounts,
  categories,
  onLink,
}: LinkTransactionDialogProps) {
  const t = useTranslations("budgets")
  const tCommon = useTranslations("common")
  const [selectedId, setSelectedId] = useState<string>(item.transaction_id ?? "")
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<"all" | LinkableType>("all")
  const [filterCategoryId, setFilterCategoryId] = useState("all")
  const [filterAccountId, setFilterAccountId] = useState("all")

  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a.name]))
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  const eligible = useMemo(() => {
    return transactions.filter((tx) => {
      const date = new Date(tx.date)
      return (
        (LINKABLE_TYPES as readonly string[]).includes(tx.type) &&
        date.getMonth() + 1 === budget.month &&
        date.getFullYear() === budget.year
      )
    })
  }, [transactions, budget])

  const filtered = useMemo(() => {
    let result = eligible
    if (filterType !== "all") result = result.filter((tx) => tx.type === filterType)
    if (filterAccountId !== "all") result = result.filter((tx) => tx.account_id === filterAccountId)
    if (filterCategoryId !== "all") result = result.filter((tx) => tx.category_id === filterCategoryId)
    if (search) result = result.filter((tx) => tx.description?.toLowerCase().includes(search.toLowerCase()))
    return result
  }, [eligible, filterType, filterAccountId, filterCategoryId, search])

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

  const TYPE_CHIP_LABELS: Record<"all" | LinkableType, string> = {
    all: t("filterAll"),
    expense: t("filterExpense"),
    credit_card_charge: t("filterCharge"),
    income: t("filterIncome"),
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("linkTransaction")}</DialogTitle>
          <DialogDescription>
            {t("linkDesc", { month: budget.month, year: budget.year, item: item.description })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-1">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-md border px-3 h-8">
            <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              placeholder={t("searchTransaction")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1">
              {(["all", "expense", "credit_card_charge", "income"] as const).map((type) => (
                <Button
                  key={type}
                  type="button"
                  size="sm"
                  variant={filterType === type ? "default" : "outline"}
                  className="h-7 text-xs px-2"
                  onClick={() => setFilterType(type)}
                >
                  {TYPE_CHIP_LABELS[type]}
                </Button>
              ))}
            </div>

            <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
              <SelectTrigger size="sm" className="h-7 text-xs min-w-[8rem]">
                <SelectValue placeholder={t("allCategories")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allCategories")}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterAccountId} onValueChange={setFilterAccountId}>
              <SelectTrigger size="sm" className="h-7 text-xs min-w-[8rem]">
                <SelectValue placeholder={t("allAccounts")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allAccounts")}</SelectItem>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transaction list */}
          <div className="max-h-60 overflow-y-auto flex flex-col gap-1 pr-0.5">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("noTransactions")}</p>
            ) : (
              filtered.map((tx) => {
                const txType = tx.type as LinkableType
                const Icon = TYPE_ICONS[txType]
                const bg = TYPE_ICON_BG[txType]
                const color = TYPE_COLORS[txType]
                const accountName = tx.account_id ? (accountMap[tx.account_id] ?? "") : t("creditCardSource")
                const catName = tx.category_id ? categoryMap[tx.category_id] : null
                const isSelected = selectedId === tx.id

                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => setSelectedId(tx.id)}
                    className={`flex items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors hover:bg-accent ${isSelected ? "border-primary bg-accent/50" : ""}`}
                  >
                    <div className={`flex size-7 shrink-0 items-center justify-center rounded-full ${bg}`}>
                      <Icon className={`size-3.5 ${color}`} />
                    </div>
                    <div className="flex flex-1 flex-col min-w-0">
                      <span className="text-sm font-medium truncate">
                        {tx.description ?? tCommon("noData")}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {new Date(tx.date).toLocaleDateString()} · {accountName}
                        {catName && <> · <span className="text-primary">{catName}</span></>}
                      </span>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ${color}`}>
                      {tx.amount.toLocaleString()}
                    </span>
                    {isSelected && <CheckIcon className="size-4 text-primary shrink-0" />}
                  </button>
                )
              })
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-2 pt-1 border-t">
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
