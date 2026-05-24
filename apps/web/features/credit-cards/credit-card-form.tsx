"use client"

import { useSession } from "next-auth/react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { useTranslations } from "next-intl"
import { creditCardApi } from "./api"
import type { CreditCard, CreditCardCreate, CreditCardUpdate } from "./types"

interface CreditCardFormProps {
  onSuccess: (card: CreditCard) => void
  onCancel: () => void
  initialValues?: CreditCard
}

export function CreditCardForm({ onSuccess, onCancel, initialValues }: CreditCardFormProps) {
  const { data: session } = useSession()
  const t = useTranslations("creditCards")
  const tCommon = useTranslations("common")
  const isEdit = Boolean(initialValues)

  const form = useForm({
    defaultValues: {
      alias: initialValues?.alias ?? "",
      credit_limit: initialValues?.credit_limit?.toString() ?? "",
      cutoff_day: initialValues?.cutoff_day?.toString() ?? "20",
      payment_day: initialValues?.payment_day?.toString() ?? "5",
      interest_rate: initialValues?.interest_rate?.toString() ?? "",
    },
    onSubmit: async ({ value }) => {
      try {
        const token = session?.accessToken ?? ""
        let card: CreditCard
        if (isEdit && initialValues) {
          const payload: CreditCardUpdate = {
            alias: value.alias,
            credit_limit: Number(value.credit_limit),
            cutoff_day: Number(value.cutoff_day),
            payment_day: Number(value.payment_day),
            interest_rate: Number(value.interest_rate),
          }
          card = await creditCardApi.update(initialValues.id, payload, token)
          toast.success(t("cardUpdated"))
        } else {
          const payload: CreditCardCreate = {
            alias: value.alias,
            credit_limit: Number(value.credit_limit),
            cutoff_day: Number(value.cutoff_day),
            payment_day: Number(value.payment_day),
            interest_rate: Number(value.interest_rate),
          }
          card = await creditCardApi.create(payload, token)
          toast.success(t("cardCreated"))
        }
        onSuccess(card)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("errorSaving"))
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
          name="alias"
          validators={{ onSubmit: ({ value }) => !value.trim() ? t("aliasRequired") : undefined }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor="alias">{t("alias")}</FieldLabel>
              <Input
                id="alias"
                placeholder={t("aliasPlaceholder")}
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
          <form.Field name="credit_limit">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="credit_limit">{t("creditLimit")}</FieldLabel>
                <Input id="credit_limit" type="number" step="0.01" placeholder="0.00"
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

          <form.Field name="cutoff_day">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="cutoff_day">{t("cutoffDay")}</FieldLabel>
                <Input id="cutoff_day" type="number" min="1" max="31" placeholder="20"
                  value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
              </Field>
            )}
          </form.Field>

          <form.Field name="payment_day">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="payment_day">{t("paymentDay")}</FieldLabel>
                <Input id="payment_day" type="number" min="1" max="31" placeholder="5"
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
                {isSubmitting ? t("saving") : isEdit ? t("saveChanges") : t("createCard")}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </FieldGroup>
    </form>
  )
}
