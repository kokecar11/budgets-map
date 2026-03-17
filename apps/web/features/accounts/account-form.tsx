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
import { accountApi } from "./api"
import type { Account, AccountCreate } from "./types"

const ACCOUNT_TYPES = [
  { value: "bank", label: "Banco" },
  { value: "cash", label: "Efectivo" },
  { value: "digital_wallet", label: "Cartera digital" },
]

interface AccountFormProps {
  onSuccess: (account: Account) => void
  onCancel: () => void
}

export function AccountForm({ onSuccess, onCancel }: AccountFormProps) {
  const { data: session } = useSession()

  const form = useForm({
    defaultValues: {
      name: "",
      type: "bank" as AccountCreate["type"],
      balance: "0",
    },
    onSubmit: async ({ value }) => {
      try {
        const payload: AccountCreate = {
          name: value.name,
          type: value.type,
          balance: Number(value.balance),
        }
        const account = await accountApi.create(
          payload,
          session?.accessToken ?? "",
        )
        toast.success("Cuenta creada exitosamente")
        onSuccess(account)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Error al crear la cuenta",
        )
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
          name="name"
          validators={{
            onSubmit: ({ value }) =>
              !value.trim() ? "El nombre es requerido" : undefined,
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor="name">Nombre</FieldLabel>
              <Input
                id="name"
                placeholder="Ej: BBVA Nómina"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-destructive text-sm">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </Field>
          )}
        </form.Field>

        <form.Field name="type">
          {(field) => (
            <Field>
              <FieldLabel>Tipo</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as AccountCreate["type"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        <form.Field name="balance">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="balance">Saldo inicial</FieldLabel>
              <Input
                id="balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
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
                {isSubmitting ? "Creando…" : "Crear cuenta"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </FieldGroup>
    </form>
  )
}
