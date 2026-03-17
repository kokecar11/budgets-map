"use client"

import { useSession } from "next-auth/react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { DatePicker } from "@workspace/ui/components/date-picker"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { savingGoalApi } from "./api"
import type { SavingGoal, SavingGoalCreate } from "./types"

interface SavingGoalFormProps {
  onSuccess: (goal: SavingGoal) => void
  onCancel: () => void
}

export function SavingGoalForm({ onSuccess, onCancel }: SavingGoalFormProps) {
  const { data: session } = useSession()

  const form = useForm({
    defaultValues: {
      name: "",
      target_amount: "",
      deadline: "",
      description: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const payload: SavingGoalCreate = {
          name: value.name,
          target_amount: Number(value.target_amount),
          deadline: value.deadline || undefined,
          description: value.description || undefined,
        }
        const goal = await savingGoalApi.create(payload, session?.accessToken ?? "")
        toast.success("Meta de ahorro creada exitosamente")
        onSuccess(goal)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al crear la meta")
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
          validators={{ onSubmit: ({ value }) => !value.trim() ? "El nombre es requerido" : undefined }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor="name">Nombre</FieldLabel>
              <Input
                id="name"
                placeholder="Ej: Fondo de emergencia"
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
          name="target_amount"
          validators={{ onSubmit: ({ value }) => !value || Number(value) <= 0 ? "El monto debe ser mayor a 0" : undefined }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor="target_amount">Monto objetivo</FieldLabel>
              <Input
                id="target_amount"
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

        <form.Field name="deadline">
          {(field) => (
            <Field>
              <FieldLabel>Fecha límite <span className="text-muted-foreground">(opcional)</span></FieldLabel>
              <DatePicker
                value={field.state.value}
                onChange={field.handleChange}
                placeholder="Sin fecha límite"
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="description">Descripción <span className="text-muted-foreground">(opcional)</span></FieldLabel>
              <Input
                id="description"
                placeholder="Ej: Para imprevistos"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
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
                {isSubmitting ? "Creando…" : "Crear meta"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </FieldGroup>
    </form>
  )
}
