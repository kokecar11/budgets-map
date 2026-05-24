"use client"

import { useSession } from "next-auth/react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { SearchSelect } from "@workspace/ui/components/search-select"

import { DatePicker } from "@workspace/ui/components/date-picker"
import { useTranslations } from "next-intl"
import { creditCardTransactionApi } from "./api"
import { AmortizationTable } from "./amortization-table"
import type { CreditCardTransaction } from "./types"
import type { Category } from "@/features/categories/types"

interface CreditCardChargeFormProps {
  creditCardId: string
  categories: Category[]
  onSuccess: (charge: CreditCardTransaction) => void
  onCancel: () => void
}

export function CreditCardChargeForm({ creditCardId, categories, onSuccess, onCancel }: CreditCardChargeFormProps) {
  const { data: session } = useSession()
  const t = useTranslations("creditCards")
  const tCommon = useTranslations("common")
  const expenseCategories = categories.filter((c) => c.type === "expense")

  const form = useForm({
    defaultValues: {
      description: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      category_id: "",
      installments: "1",
      interest_rate: "0",
    },
    onSubmit: async ({ value }) => {
      try {
        const token = session?.accessToken ?? ""
        const charge = await creditCardTransactionApi.create(
          creditCardId,
          {
            credit_card_id: creditCardId,
            description: value.description,
            amount: Number(value.amount),
            date: new Date(value.date + "T00:00:00").toISOString(),
            category_id: value.category_id,
            installments: Number(value.installments) || 1,
            installment_number: 1,
            interest_rate: Number(value.interest_rate) || undefined,
          },
          token
        )
        toast.success(t("chargeRegistered"))
        onSuccess(charge)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("errorRegisteringCharge"))
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
          name="description"
          validators={{ onSubmit: ({ value }) => !value.trim() ? t("descriptionRequired") : undefined }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor="description">{t("descriptionField")}</FieldLabel>
              <Input
                id="description"
                placeholder={t("descriptionPlaceholder")}
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

        <form.Field
          name="amount"
          validators={{ onSubmit: ({ value }) => !value || Number(value) <= 0 ? t("chargeAmountRequired") : undefined }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor="amount">{t("chargeAmountLabel")}</FieldLabel>
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
              <FieldLabel>{t("dateField")}</FieldLabel>
              <DatePicker
                value={field.state.value ?? ""}
                onChange={field.handleChange}
              />
            </Field>
          )}
        </form.Field>

        <form.Field
          name="category_id"
          validators={{ onSubmit: ({ value }) => !value ? t("categoryRequired") : undefined }}
        >
          {(field) => (
            <Field>
              <FieldLabel>{t("categoryField")}</FieldLabel>
              <SearchSelect
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v)}
                options={expenseCategories.map((c) => ({ value: c.id, label: `${c.icon ? `${c.icon} ` : ""}${c.name}` }))}
                placeholder={t("selectCategory")}
                searchPlaceholder={t("searchCategory")}
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-destructive text-sm">{field.state.meta.errors[0]}</p>
              )}
            </Field>
          )}
        </form.Field>

        {/* Cuotas e interés en grid */}
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="installments">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="installments">{t("installmentsField")}</FieldLabel>
                <Input
                  id="installments"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="interest_rate">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="interest_rate">
                  {t("interestRateEA")}
                </FieldLabel>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t("interestRateHint")}</p>
              </Field>
            )}
          </form.Field>
        </div>

        {/* Tabla de amortización interactiva */}
        <form.Subscribe selector={(s) => ({
          amount: s.values.amount,
          installments: s.values.installments,
          interest_rate: s.values.interest_rate,
        })}>
          {({ amount, installments, interest_rate }) => {
            const a = Number(amount)
            const n = Number(installments) || 1
            const r = Number(interest_rate)
            if (a <= 0 || n <= 1) return null
            return (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("amortizationTableLabel")}
                </p>
                <AmortizationTable
                  principal={a}
                  annualRateEA={r}
                  installments={n}
                  startDate={new Date()}
                />
              </div>
            )
          }}
        </form.Subscribe>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("registering") : t("registerCharge")}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </FieldGroup>
    </form>
  )
}
