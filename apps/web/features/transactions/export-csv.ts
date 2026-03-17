import type { Transaction } from "./types"
import type { Account } from "@/features/accounts/types"
import type { Category } from "@/features/categories/types"

const TYPE_LABELS: Record<string, string> = {
  income: "Ingreso",
  expense: "Gasto",
  transfer: "Transferencia",
  saving: "Ahorro",
}

export function exportTransactionsCSV(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
) {
  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a.name]))
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  const headers = ["Fecha", "Tipo", "Descripción", "Cuenta", "Categoría", "Monto"]

  const rows = transactions.map((tx) => [
    new Date(tx.date).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }),
    TYPE_LABELS[tx.type] ?? tx.type,
    tx.description ?? "",
    accountMap[tx.account_id] ?? tx.account_id,
    tx.category_id ? (categoryMap[tx.category_id] ?? tx.category_id) : "",
    tx.type === "expense" ? `-${tx.amount}` : `${tx.amount}`,
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `transacciones_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
