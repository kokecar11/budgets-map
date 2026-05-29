import type { Transaction } from "./types"
import type { Account } from "@/features/accounts/types"
import type { Category } from "@/features/categories/types"
import type { Locale } from "@/i18n/routing"
import { LOCALE_TAG } from "@/lib/dates"

export interface ExportCsvLabels {
  date: string
  type: string
  description: string
  account: string
  category: string
  amount: string
  typeIncome: string
  typeExpense: string
  typeTransfer: string
  typeSaving: string
  typeCreditCardCharge: string
}

export function exportTransactionsCSV(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  locale: Locale,
  labels: ExportCsvLabels,
) {
  const localeTag = LOCALE_TAG[locale]
  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a.name]))
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  const typeLabels: Record<string, string> = {
    income: labels.typeIncome,
    expense: labels.typeExpense,
    transfer: labels.typeTransfer,
    saving: labels.typeSaving,
    credit_card_charge: labels.typeCreditCardCharge,
  }

  const headers = [labels.date, labels.type, labels.description, labels.account, labels.category, labels.amount]

  const rows = transactions.map((tx) => [
    new Date(tx.date).toLocaleDateString(localeTag, { day: "2-digit", month: "2-digit", year: "numeric" }),
    typeLabels[tx.type] ?? tx.type,
    tx.description ?? "",
    tx.account_id ? (accountMap[tx.account_id] ?? tx.account_id) : labels.typeCreditCardCharge,
    tx.category_id ? (categoryMap[tx.category_id] ?? tx.category_id) : "",
    tx.type === "expense" ? `-${tx.amount}` : `${tx.amount}`,
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
