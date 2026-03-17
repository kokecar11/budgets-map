"use client"

import { useSession } from "next-auth/react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { SearchSelect } from "@workspace/ui/components/search-select"

import { DatePicker } from "@workspace/ui/components/date-picker"
import { creditCardPeriodApi, creditCardPaymentApi } from "./api"
import { transactionApi } from "@/features/transactions/api"
import type { CreditCard, CreditCardPayment, CreditCardPeriod } from "./types"
import type { Account } from "@/features/accounts/types"

interface CreditCardPaymentFormProps {
  card: CreditCard
  periods: CreditCardPeriod[]
  accounts: Account[]
  onSuccess: (payment: CreditCardPayment) => void
  onCancel: () => void
}

function computePeriodDates(card: CreditCard, paymentDate: Date) {
  const cutoff = card.cutoff_day
  const day = paymentDate.getDate()
  let year = paymentDate.getFullYear()
  let month = paymentDate.getMonth() + 1 // 1-12

  if (day <= cutoff) {
    // Before this month's cutoff → period started last month
    month -= 1
    if (month === 0) { month = 12; year -= 1 }
  }

  const pad = (n: number) => String(n).padStart(2, "0")
  const periodDateStr = `${year}-${pad(month)}-${pad(cutoff)}`

  let dueMonth = month + 1
  let dueYear = year
  if (dueMonth > 12) { dueMonth = 1; dueYear += 1 }
  const dueDateStr = `${dueYear}-${pad(dueMonth)}-${pad(card.payment_day)}`

  return { periodDateStr, dueDateStr, yearMonth: `${year}-${pad(month)}` }
}

export function CreditCardPaymentForm({ card, periods, accounts, onSuccess, onCancel }: CreditCardPaymentFormProps) {
  const { data: session } = useSession()

  const form = useForm({
    defaultValues: {
      account_id: "",
      amount: "",
      type: "partial" as "minimum" | "total" | "partial",
      date: new Date().toISOString().split("T")[0],
    },
    onSubmit: async ({ value }) => {
      try {
        const token = session?.accessToken ?? ""
        const amount = Number(value.amount)
        const isoDate = new Date(value.date + "T00:00:00").toISOString()
        const paymentDate = new Date(value.date + "T00:00:00")

        const { periodDateStr, dueDateStr, yearMonth } = computePeriodDates(card, paymentDate)

        // Find or create period for this billing cycle
        const existingPeriod = periods.find((p) => p.period_date.slice(0, 7) === yearMonth)
        let periodId: string

        if (existingPeriod) {
          periodId = existingPeriod.id
        } else {
          const newPeriod = await creditCardPeriodApi.create(
            {
              credit_card_id: card.id,
              period_date: new Date(periodDateStr + "T00:00:00").toISOString(),
              opening_balance: 0,
              consumed: 0,
              minimum_payment: Math.round(amount * 0.1 * 100) / 100,
              total_payment: amount,
              closing_balance: amount,
              due_date: new Date(dueDateStr + "T00:00:00").toISOString(),
            },
            token
          )
          periodId = newPeriod.id
        }

        const payment = await creditCardPaymentApi.create(
          {
            credit_card_id: card.id,
            period_id: periodId,
            amount,
            type: value.type,
            date: isoDate,
          },
          token
        )

        // Register as expense transaction
        await transactionApi.create(
          {
            account_id: value.account_id,
            type: "expense",
            amount,
            date: isoDate,
            description: `Pago tarjeta ${card.alias}`,
            credit_card_payment_id: payment.id,
          },
          token
        )

        toast.success("Pago registrado exitosamente")
        onSuccess(payment)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al registrar el pago")
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field
          name="account_id"
          validators={{ onSubmit: ({ value }) => !value ? "Selecciona una cuenta" : undefined }}
        >
          {(field) => (
            <Field>
              <FieldLabel>Cuenta de origen</FieldLabel>
              <SearchSelect
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v)}
                options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                placeholder="Seleccionar cuenta"
                searchPlaceholder="Buscar cuenta..."
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-destructive text-sm">{field.state.meta.errors[0]}</p>
              )}
            </Field>
          )}
        </form.Field>

        <form.Field name="type">
          {(field) => (
            <Field>
              <FieldLabel>Tipo de pago</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as "minimum" | "total" | "partial")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar tipo de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partial">Pago parcial</SelectItem>
                  <SelectItem value="minimum">Pago mínimo</SelectItem>
                  <SelectItem value="total">Pago total</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        <form.Field
          name="amount"
          validators={{ onSubmit: ({ value }) => !value || Number(value) <= 0 ? "El monto debe ser mayor a 0" : undefined }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor="amount">Monto</FieldLabel>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-destructive text-sm">{field.state.meta.errors[0]}</p>
              )}
            </Field>
          )}
        </form.Field>

        <form.Field name="date">
          {(field) => (
            <Field>
              <FieldLabel>Fecha</FieldLabel>
              <DatePicker
                value={field.state.value}
                onChange={field.handleChange}
              />
            </Field>
          )}
        </form.Field>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Registrando…" : "Registrar pago"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </FieldGroup>
    </form>
  )
}
