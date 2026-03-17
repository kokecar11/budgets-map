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
import { budgetApi } from "./api"
import type { Budget, BudgetCreate } from "./types"

const MONTHS = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
]

const currentYear = new Date().getFullYear()
const YEARS = [currentYear - 1, currentYear, currentYear + 1]

interface BudgetFormProps {
  onSuccess: (budget: Budget) => void
  onCancel: () => void
}

export function BudgetForm({ onSuccess, onCancel }: BudgetFormProps) {
  const { data: session } = useSession()

  const form = useForm({
    defaultValues: {
      name: "",
      month: String(new Date().getMonth() + 1),
      year: String(currentYear),
      description: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const payload: BudgetCreate = {
          name: value.name,
          month: Number(value.month),
          year: Number(value.year),
          description: value.description || undefined,
        }
        const budget = await budgetApi.create(payload, session?.accessToken ?? "")
        toast.success("Presupuesto creado exitosamente")
        onSuccess(budget)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al crear el presupuesto")
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
            onSubmit: ({ value }) => {
              if (!value.trim()) return "El nombre es requerido"
            },
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor="name">Nombre</FieldLabel>
              <Input
                id="name"
                placeholder="Ej: Presupuesto Marzo 2026"
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
          <form.Field
            name="month"
            validators={{
              onSubmit: ({ value }) => {
                if (!value) return "Selecciona un mes"
              },
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel>Mes</FieldLabel>
                <Select value={field.state.value} onValueChange={(v) => field.handleChange(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">{field.state.meta.errors[0]}</p>
                )}
              </Field>
            )}
          </form.Field>

          <form.Field
            name="year"
            validators={{
              onSubmit: ({ value }) => {
                if (!value) return "Selecciona un año"
              },
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel>Año</FieldLabel>
                <Select value={field.state.value} onValueChange={(v) => field.handleChange(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar año" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">{field.state.meta.errors[0]}</p>
                )}
              </Field>
            )}
          </form.Field>
        </div>

        <form.Field name="description">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="description">Descripción <span className="text-muted-foreground">(opcional)</span></FieldLabel>
              <Input
                id="description"
                placeholder="Ej: Gastos del mes de marzo"
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
                {isSubmitting ? "Creando…" : "Crear presupuesto"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </FieldGroup>
    </form>
  )
}
