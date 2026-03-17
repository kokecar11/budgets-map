"use client"

import { useSession } from "next-auth/react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { budgetItemApi } from "./api"
import type { BudgetItem, BudgetItemCreate } from "./types"
import type { Category } from "@/features/categories/types"

interface BudgetItemFormProps {
  budgetId: string
  categories: Category[]
  onSuccess: (item: BudgetItem) => void
  onCancel: () => void
}

export function BudgetItemForm({ budgetId, categories, onSuccess, onCancel }: BudgetItemFormProps) {
  const { data: session } = useSession()

  const form = useForm({
    defaultValues: {
      description: "",
      planned_amount: "",
      category_id: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const payload: BudgetItemCreate = {
          description: value.description,
          planned_amount: Number(value.planned_amount),
          category_id: value.category_id || undefined,
        }
        const item = await budgetItemApi.create(budgetId, payload, session?.accessToken ?? "")
        toast.success("Ítem agregado exitosamente")
        onSuccess(item)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al agregar el ítem")
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
          validators={{
            onSubmit: ({ value }) => {
              if (!value.trim()) return "La descripción es requerida"
            },
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor="description">Descripción</FieldLabel>
              <Input
                id="description"
                placeholder="Ej: Arriendo, Mercado, Netflix…"
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
          name="planned_amount"
          validators={{
            onSubmit: ({ value }) => {
              if (!value) return "El monto es requerido"
              if (isNaN(Number(value)) || Number(value) <= 0) return "Ingresa un monto válido"
            },
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor="planned_amount">Monto planeado</FieldLabel>
              <Input
                id="planned_amount"
                type="number"
                min="0"
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

        {categories.length > 0 && (
          <form.Field name="category_id">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="category_id">Categoría <span className="text-muted-foreground font-normal">(opcional)</span></FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger id="category_id">
                    <SelectValue placeholder="Sin categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin categoría</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </form.Field>
        )}

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Agregando…" : "Agregar ítem"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </FieldGroup>
    </form>
  )
}
