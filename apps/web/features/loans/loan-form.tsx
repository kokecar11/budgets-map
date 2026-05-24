"use client"

import { useSession } from "next-auth/react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { DatePicker } from "@workspace/ui/components/date-picker"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { useTranslations } from "next-intl"
import { loanApi } from "./api"
import type { Loan, LoanCreate } from "./types"

interface LoanFormProps {
  onSuccess: (loan: Loan) => void
  onCancel: () => void
}

export function LoanForm({ onSuccess, onCancel }: LoanFormProps) {
  const { data: session } = useSession()
  const t = useTranslations("loans")
  const tCommon = useTranslations("common")

  const form = useForm({
    defaultValues: {
      name: "",
      lender: "",
      principal: "",
      balance: "",
      interest_rate: "",
      monthly_payment: "",
      start_date: "",
      end_date: "",
      payment_day: "1",
    },
    onSubmit: async ({ value }) => {
      try {
        const payload: LoanCreate = {
          name: value.name,
          lender: value.lender,
          principal: Number(value.principal),
          balance: Number(value.balance),
          interest_rate: Number(value.interest_rate),
          monthly_payment: Number(value.monthly_payment),
          start_date: new Date(value.start_date + "T00:00:00").toISOString(),
          end_date: new Date(value.end_date + "T00:00:00").toISOString(),
          payment_day: Number(value.payment_day),
        }
        const loan = await loanApi.create(payload, session?.accessToken ?? "")
        toast.success(t("loanCreated"))
        onSuccess(loan)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("errorCreating"))
      }
    },
  })

  const required = (value: string) => !value.trim() ? t("fieldRequired") : undefined

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field name="name" validators={{ onSubmit: ({ value }) => required(value) }}>
          {(field) => (
            <Field>
              <FieldLabel htmlFor="name">{t("loanName")}</FieldLabel>
              <Input
                id="name"
                placeholder={t("loanNamePlaceholder")}
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

        <form.Field name="lender" validators={{ onSubmit: ({ value }) => required(value) }}>
          {(field) => (
            <Field>
              <FieldLabel htmlFor="lender">{t("lender")}</FieldLabel>
              <Input
                id="lender"
                placeholder={t("lenderPlaceholder")}
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

        <div className="grid grid-cols-2 gap-4">
          <form.Field name="principal">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="principal">{t("originalPrincipal")}</FieldLabel>
                <Input id="principal" type="number" step="0.01" placeholder="0.00"
                  value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
              </Field>
            )}
          </form.Field>

          <form.Field name="balance">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="balance">{t("currentBalance")}</FieldLabel>
                <Input id="balance" type="number" step="0.01" placeholder="0.00"
                  value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
              </Field>
            )}
          </form.Field>

          <form.Field name="interest_rate">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="interest_rate">{t("interestRate")}</FieldLabel>
                <Input id="interest_rate" type="number" step="0.01" placeholder="0.00"
                  value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
              </Field>
            )}
          </form.Field>

          <form.Field name="monthly_payment">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="monthly_payment">{t("monthlyPayment")}</FieldLabel>
                <Input id="monthly_payment" type="number" step="0.01" placeholder="0.00"
                  value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
              </Field>
            )}
          </form.Field>

          <form.Field name="start_date">
            {(field) => (
              <Field>
                <FieldLabel>{t("startDate")}</FieldLabel>
                <DatePicker value={field.state.value ?? ""} onChange={field.handleChange} />
              </Field>
            )}
          </form.Field>

          <form.Field name="end_date">
            {(field) => (
              <Field>
                <FieldLabel>{t("endDate")}</FieldLabel>
                <DatePicker value={field.state.value ?? ""} onChange={field.handleChange} />
              </Field>
            )}
          </form.Field>

          <form.Field name="payment_day">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="payment_day">{t("paymentDayField")}</FieldLabel>
                <Input id="payment_day" type="number" min="1" max="31" placeholder="1"
                  value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
              </Field>
            )}
          </form.Field>
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("creating") : t("createLoan")}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </FieldGroup>
    </form>
  )
}
