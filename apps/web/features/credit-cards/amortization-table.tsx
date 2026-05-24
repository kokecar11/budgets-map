"use client"

import { useState, useMemo } from "react"
import { Input } from "@workspace/ui/components/input"
import { useLocale, useTranslations } from "next-intl"
import { LOCALE_TAG } from "@/lib/dates"
import type { Locale } from "@/i18n/routing"
import { useCurrency } from "@/hooks/use-currency"

interface AmortizationRow {
  installment: number
  scheduledPayment: number
  interest: number
  principal: number
  balance: number
}

interface AmortizationTableProps {
  principal: number
  annualRateEA: number  // Tasa Efectiva Anual (%)
  installments: number
  startDate?: Date
}

/** Convierte Tasa Efectiva Anual a Tasa Efectiva Mensual */
function monthlyRate(annualRateEA: number): number {
  return Math.pow(1 + annualRateEA / 100, 1 / 12) - 1
}

/**
 * Genera la tabla de amortización.
 * Si el usuario ingresa un pago real diferente en alguna cuota,
 * recalcula el saldo y la cuota fija de las cuotas siguientes.
 */
function buildSchedule(
  principal: number,
  i: number,
  totalInstallments: number,
  actualPayments: Record<number, number>
): AmortizationRow[] {
  const rows: AmortizationRow[] = []
  let balance = principal

  for (let k = 1; k <= totalInstallments; k++) {
    const interest = balance * i
    const remaining = totalInstallments - k + 1

    // Cuota fija calculada sobre el saldo actual y cuotas restantes
    const scheduled =
      i > 0
        ? (balance * i) / (1 - Math.pow(1 + i, -remaining))
        : balance / remaining

    const paid = actualPayments[k] ?? scheduled
    // Capital abonado = lo que se pagó menos el interés del período
    const capitalPaid = Math.max(0, paid - interest)
    balance = Math.max(0, balance - capitalPaid)

    rows.push({
      installment: k,
      scheduledPayment: scheduled,
      interest,
      principal: capitalPaid,
      balance,
    })
  }
  return rows
}

function addMonths(base: Date, months: number, localeTag: string): string {
  const d = new Date(base)
  d.setMonth(d.getMonth() + months)
  return d.toLocaleDateString(localeTag, { month: "short", year: "2-digit" })
}

export function AmortizationTable({
  principal,
  annualRateEA,
  installments,
  startDate,
}: AmortizationTableProps) {
  const locale = useLocale() as Locale
  const t = useTranslations("creditCards")
  const localeTag = LOCALE_TAG[locale]
  const fmt = useCurrency()
  const [actualPayments, setActualPayments] = useState<Record<number, string>>({})

  const i = useMemo(() => monthlyRate(annualRateEA), [annualRateEA])

  const parsedPayments = useMemo(() => {
    const result: Record<number, number> = {}
    for (const [k, v] of Object.entries(actualPayments)) {
      const num = Number(v)
      if (!isNaN(num) && num > 0) result[Number(k)] = num
    }
    return result
  }, [actualPayments])

  const schedule = useMemo(
    () => buildSchedule(principal, i, installments, parsedPayments),
    [principal, i, installments, parsedPayments]
  )

  const totalInterest = schedule.reduce((s, r) => s + r.interest, 0)
  const totalPaid = schedule.reduce(
    (s, r) => s + (parsedPayments[r.installment] ?? r.scheduledPayment),
    0
  )

  const base = startDate ?? new Date()
  const hasCustomPayments = Object.keys(parsedPayments).length > 0

  return (
    <div className="flex flex-col gap-2">
      {hasCustomPayments && (
        <p className="text-xs text-blue-600">
          {t("amortTableCustomNote")}
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr className="border-b text-muted-foreground">
              <th className="text-left px-2 py-2 font-medium">#</th>
              <th className="text-left px-2 py-2 font-medium">{t("amortTableEstDate")}</th>
              <th className="text-right px-2 py-2 font-medium">{t("amortTableInstallment")}</th>
              <th className="text-right px-2 py-2 font-medium text-red-600">{t("amortTableInterest")}</th>
              <th className="text-right px-2 py-2 font-medium">{t("amortTablePrincipal")}</th>
              <th className="text-right px-2 py-2 font-medium">{t("amortTableBalance")}</th>
              <th className="text-right px-2 py-2 font-medium">{t("amortTableActualPayment")}</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((row) => {
              const isModified = !!parsedPayments[row.installment]
              return (
                <tr
                  key={row.installment}
                  className={`border-b last:border-0 ${isModified ? "bg-blue-50/50" : ""}`}
                >
                  <td className="px-2 py-1.5 text-muted-foreground font-medium">
                    {row.installment}
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground">
                    {addMonths(base, row.installment, localeTag)}
                  </td>
                  <td className="px-2 py-1.5 text-right font-medium">
                    ${fmt(row.scheduledPayment)}
                  </td>
                  <td className="px-2 py-1.5 text-right text-red-600">
                    ${fmt(row.interest)}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    ${fmt(row.principal)}
                  </td>
                  <td className="px-2 py-1.5 text-right text-muted-foreground">
                    ${fmt(row.balance)}
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      type="number"
                      className="h-6 text-xs text-right w-28 ml-auto"
                      placeholder={fmt(row.scheduledPayment)}
                      value={actualPayments[row.installment] ?? ""}
                      onChange={(e) =>
                        setActualPayments((prev) => ({
                          ...prev,
                          [row.installment]: e.target.value,
                        }))
                      }
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-muted/30">
            <tr className="border-t font-semibold">
              <td colSpan={2} className="px-2 py-2 text-muted-foreground text-xs">
                {t("amortTableTotal")}
              </td>
              <td className="px-2 py-2 text-right">${fmt(totalPaid)}</td>
              <td className="px-2 py-2 text-right text-red-600">${fmt(totalInterest)}</td>
              <td className="px-2 py-2 text-right">${fmt(principal)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
