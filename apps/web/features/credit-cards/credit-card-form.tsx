"use client"

import { useSession } from "next-auth/react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { creditCardApi } from "./api"
import type { CreditCard, CreditCardCreate } from "./types"

interface CreditCardFormProps {
  onSuccess: (card: CreditCard) => void
  onCancel: () => void
}

export function CreditCardForm({ onSuccess, onCancel }: CreditCardFormProps) {
  const { data: session } = useSession()

  const form = useForm({
    defaultValues: {
      alias: "",
      credit_limit: "",
      cutoff_day: "20",
      payment_day: "5",
      interest_rate: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const payload: CreditCardCreate = {
          alias: value.alias,
          credit_limit: Number(value.credit_limit),
          cutoff_day: Number(value.cutoff_day),
          payment_day: Number(value.payment_day),
          interest_rate: Number(value.interest_rate),
        }
        const card = await creditCardApi.create(payload, session?.accessToken ?? "")
        toast.success("Tarjeta creada exitosamente")
        onSuccess(card)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al crear la tarjeta")
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
          validators={{ onSubmit: ({ value }) => !value.trim() ? "El alias es requerido" : undefined }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor="alias">Alias</FieldLabel>
              <Input
                id="alias"
                placeholder="Ej: Visa Platinum"
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
                <FieldLabel htmlFor="credit_limit">Límite de crédito</FieldLabel>
                <Input id="credit_limit" type="number" step="0.01" placeholder="0.00"
                  value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
              </Field>
            )}
          </form.Field>

          <form.Field name="interest_rate">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="interest_rate">Tasa de interés (%)</FieldLabel>
                <Input id="interest_rate" type="number" step="0.01" placeholder="0.00"
                  value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
              </Field>
            )}
          </form.Field>

          <form.Field name="cutoff_day">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="cutoff_day">Día de corte</FieldLabel>
                <Input id="cutoff_day" type="number" min="1" max="31" placeholder="20"
                  value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
              </Field>
            )}
          </form.Field>

          <form.Field name="payment_day">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="payment_day">Día de pago</FieldLabel>
                <Input id="payment_day" type="number" min="1" max="31" placeholder="5"
                  value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
              </Field>
            )}
          </form.Field>
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creando…" : "Crear tarjeta"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </FieldGroup>
    </form>
  )
}
