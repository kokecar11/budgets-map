import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { Transaction } from "./types"
import type { Account } from "@/features/accounts/types"
import type { Category } from "@/features/categories/types"
import type { Locale } from "@/i18n/routing"
import { LOCALE_TAG } from "@/lib/dates"

// Brand colors
const NAVY   = [14, 23, 42]   as [number, number, number]  // #0e172a
const WHITE  = [255, 255, 255] as [number, number, number]
const GREEN  = [22, 163, 74]   as [number, number, number]
const RED    = [220, 38, 38]   as [number, number, number]
const GRAY   = [107, 114, 128] as [number, number, number]
const LIGHT  = [248, 250, 252] as [number, number, number]
const BORDER = [226, 232, 240] as [number, number, number]

export interface ExportPdfLabels {
  // Column headers (shared with CSV)
  date: string
  type: string
  description: string
  account: string
  category: string
  amount: string
  // Type labels
  typeIncome: string
  typeExpense: string
  typeTransfer: string
  typeSaving: string
  typeCreditCardCharge: string
  // PDF-specific
  reportTitle: string
  generatedOn: string
  numTransactions: string
  totalIncome: string
  totalExpenses: string
  netBalance: string
  expensesByCategory: string
  transactionDetail: string
  confidential: string
  page: (page: number, total: number) => string
  pctOfExpenses: string
  noData: string
  noCategory: string
}

function fmt(n: number, localeTag: string) {
  return `$ ${n.toLocaleString(localeTag, { minimumFractionDigits: 0 })}`
}

function pct(part: number, total: number) {
  if (total === 0) return "0%"
  return `${((part / total) * 100).toFixed(1)}%`
}

export function exportTransactionsPDF(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  userName: string,
  userEmail: string,
  locale: Locale,
  labels: ExportPdfLabels,
) {
  const localeTag = LOCALE_TAG[locale]
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const W = doc.internal.pageSize.getWidth()   // 210
  const now = new Date()
  const generatedAt = now.toLocaleDateString(localeTag, { day: "numeric", month: "long", year: "numeric" })

  const typeLabels: Record<string, string> = {
    income: labels.typeIncome,
    expense: labels.typeExpense,
    transfer: labels.typeTransfer,
    saving: labels.typeSaving,
    credit_card_charge: labels.typeCreditCardCharge,
  }

  const accountMap  = Object.fromEntries(accounts.map((a) => [a.id, a.name]))
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  // ── Totals ────────────────────────────────────────────
  const totalIncome  = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const netBalance   = totalIncome - totalExpense

  // ── Category breakdown ─────────────────────────────────
  const catMap: Record<string, number> = {}
  for (const tx of transactions) {
    if (tx.type !== "expense" || !tx.category_id) continue
    catMap[tx.category_id] = (catMap[tx.category_id] ?? 0) + tx.amount
  }
  const categoryRows = Object.entries(catMap)
    .map(([id, amount]) => [categoryMap[id] ?? labels.noCategory, fmt(amount, localeTag), pct(amount, totalExpense)])
    .sort((a, b) => {
      const aVal = parseFloat((a[1] ?? "").replace(/[^0-9.]/g, ""))
      const bVal = parseFloat((b[1] ?? "").replace(/[^0-9.]/g, ""))
      return bVal - aVal
    })

  // ══════════════════════════════════════════════════════
  // HEADER BANNER
  // ══════════════════════════════════════════════════════
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, 38, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.setTextColor(...WHITE)
  doc.text("Budgets Map", 14, 16)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(180, 195, 220)
  doc.text(labels.reportTitle, 14, 23)

  // User info — right side
  doc.setFontSize(8)
  doc.setTextColor(...WHITE)
  doc.text(userName,    W - 14, 13, { align: "right" })
  doc.text(userEmail,   W - 14, 19, { align: "right" })
  doc.text(`${labels.generatedOn} ${generatedAt}`, W - 14, 25, { align: "right" })
  doc.text(labels.numTransactions, W - 14, 31, { align: "right" })

  // ══════════════════════════════════════════════════════
  // SUMMARY CARDS  (3 boxes side by side)
  // ══════════════════════════════════════════════════════
  let y = 46
  const cardW = 56
  const cardH = 22
  const gap   = 8
  const startX = 14

  const cards = [
    { label: labels.totalIncome,   value: fmt(totalIncome, localeTag),           color: GREEN },
    { label: labels.totalExpenses, value: fmt(totalExpense, localeTag),           color: RED   },
    { label: labels.netBalance,    value: fmt(Math.abs(netBalance), localeTag),
      color: netBalance >= 0 ? GREEN : RED },
  ] as const

  cards.forEach(({ label, value, color }, i) => {
    const x = startX + i * (cardW + gap)
    doc.setFillColor(...LIGHT)
    doc.setDrawColor(...BORDER)
    doc.roundedRect(x, y, cardW, cardH, 3, 3, "FD")

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(...GRAY)
    doc.text(label.toUpperCase(), x + 4, y + 7)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(...color)
    doc.text(value, x + 4, y + 16)
  })

  // ══════════════════════════════════════════════════════
  // CATEGORY BREAKDOWN TABLE
  // ══════════════════════════════════════════════════════
  y += cardH + 10

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(...NAVY)
  doc.text(labels.expensesByCategory, 14, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [[labels.category, labels.amount, labels.pctOfExpenses]],
    body: categoryRows.length > 0 ? categoryRows : [[labels.noData, "", ""]],
    theme: "plain",
    styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 50, halign: "right" },
      2: { cellWidth: 40, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  })

  // ══════════════════════════════════════════════════════
  // TRANSACTIONS TABLE
  // ══════════════════════════════════════════════════════
  const afterCat = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  y = afterCat + 10

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(...NAVY)
  doc.text(labels.transactionDetail, 14, y)
  y += 4

  const txRows = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((tx) => [
      new Date(tx.date).toLocaleDateString(localeTag, { day: "2-digit", month: "2-digit", year: "2-digit" }),
      typeLabels[tx.type] ?? tx.type,
      tx.description ?? "—",
      tx.account_id ? (accountMap[tx.account_id] ?? "—") : labels.typeCreditCardCharge,
      tx.category_id ? (categoryMap[tx.category_id] ?? "—") : "—",
      (tx.type === "expense" ? "-" : "+") + fmt(tx.amount, localeTag),
    ])

  autoTable(doc, {
    startY: y,
    head: [[labels.date, labels.type, labels.description, labels.account, labels.category, labels.amount]],
    body: txRows,
    theme: "plain",
    styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [30, 41, 59] },
    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 7.5,
    },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 22 },
      2: { cellWidth: 50 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
      5: { cellWidth: 28, halign: "right" },
    },
    margin: { left: 14, right: 14 },
    didParseCell(data) {
      if (data.column.index === 5 && data.section === "body") {
        const val = String(data.cell.raw ?? "")
        data.cell.styles.textColor = val.startsWith("-") ? RED : GREEN
        data.cell.styles.fontStyle = "bold"
      }
    },
  })

  // ── Footer on every page ───────────────────────────────
  const totalPages = (doc as jsPDF & { internal: { getNumberOfPages: () => number } })
    .internal.getNumberOfPages()

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    const H = doc.internal.pageSize.getHeight()
    doc.setFillColor(...NAVY)
    doc.rect(0, H - 10, W, 10, "F")
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(180, 195, 220)
    doc.text(labels.confidential, 14, H - 3.5)
    doc.text(labels.page(p, totalPages), W - 14, H - 3.5, { align: "right" })
  }

  doc.save(`transactions_${now.toISOString().slice(0, 10)}.pdf`)
}
