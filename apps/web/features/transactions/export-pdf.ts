import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { Transaction } from "./types"
import type { Account } from "@/features/accounts/types"
import type { Category } from "@/features/categories/types"

// Brand colors
const NAVY   = [14, 23, 42]   as [number, number, number]  // #0e172a
const WHITE  = [255, 255, 255] as [number, number, number]
const GREEN  = [22, 163, 74]   as [number, number, number]
const RED    = [220, 38, 38]   as [number, number, number]
const GRAY   = [107, 114, 128] as [number, number, number]
const LIGHT  = [248, 250, 252] as [number, number, number]
const BORDER = [226, 232, 240] as [number, number, number]

const TYPE_LABELS: Record<string, string> = {
  income: "Ingreso", expense: "Gasto",
  transfer: "Transferencia", saving: "Ahorro",
}

function fmt(n: number) {
  return `$ ${n.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`
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
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const W = doc.internal.pageSize.getWidth()   // 210
  const now = new Date()
  const generatedAt = now.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })

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
    .map(([id, amount]) => [categoryMap[id] ?? "Sin categoría", fmt(amount), pct(amount, totalExpense)])
    .sort((a, b) => {
      const aVal = parseFloat(a[1].replace(/[^0-9.]/g, ""))
      const bVal = parseFloat(b[1].replace(/[^0-9.]/g, ""))
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
  doc.text("Reporte Financiero de Transacciones", 14, 23)

  // User info — right side
  doc.setFontSize(8)
  doc.setTextColor(...WHITE)
  doc.text(userName,    W - 14, 13, { align: "right" })
  doc.text(userEmail,   W - 14, 19, { align: "right" })
  doc.text(`Generado el ${generatedAt}`, W - 14, 25, { align: "right" })
  doc.text(`${transactions.length} transacciones`, W - 14, 31, { align: "right" })

  // ══════════════════════════════════════════════════════
  // SUMMARY CARDS  (3 boxes side by side)
  // ══════════════════════════════════════════════════════
  let y = 46
  const cardW = 56
  const cardH = 22
  const gap   = 8
  const startX = 14

  const cards = [
    { label: "Total Ingresos", value: fmt(totalIncome),  color: GREEN },
    { label: "Total Gastos",   value: fmt(totalExpense), color: RED   },
    { label: "Balance Neto",   value: fmt(Math.abs(netBalance)),
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
  doc.text("Gastos por categoría", 14, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [["Categoría", "Total", "% del gasto"]],
    body: categoryRows.length > 0 ? categoryRows : [["Sin datos", "", ""]],
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
  doc.text("Detalle de transacciones", 14, y)
  y += 4

  const txRows = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((tx) => [
      new Date(tx.date).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "2-digit" }),
      TYPE_LABELS[tx.type] ?? tx.type,
      tx.description ?? "—",
      accountMap[tx.account_id] ?? "—",
      tx.category_id ? (categoryMap[tx.category_id] ?? "—") : "—",
      (tx.type === "expense" ? "-" : "+") + fmt(tx.amount),
    ])

  autoTable(doc, {
    startY: y,
    head: [["Fecha", "Tipo", "Descripción", "Cuenta", "Categoría", "Monto"]],
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
      // Color amount column
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
    doc.text("Budgets Map — Reporte financiero confidencial", 14, H - 3.5)
    doc.text(`Página ${p} / ${totalPages}`, W - 14, H - 3.5, { align: "right" })
  }

  doc.save(`reporte_transacciones_${now.toISOString().slice(0, 10)}.pdf`)
}
