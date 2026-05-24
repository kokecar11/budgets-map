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
import { useTranslations } from "next-intl"
import { budgetApi } from "./api"
import type { Budget, BudgetCreate } from "./types"

const currentYear = new Date().getFullYear()
const YEARS = [currentYear - 1, currentYear, currentYear + 1]

interface BudgetFormProps {
  onSuccess: (budget: Budget) => void
  onCancel: () => void
}

export function BudgetForm({ onSuccess, onCancel }: BudgetFormProps) {
  const { data: session } = useSession()
  const t = useTranslations("budgets")
  const tCommon = useTranslations("common")

  const MONTHS = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: t(`months.${i + 1}`),
  }))

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
        toast.success(t("budgetCreated"))
        onSuccess(budget)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("errorCreating"))
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
              if (!value.trim()) return t("nameRequired")
            },
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor="name">{t("name")}</FieldLabel>
              <Input
                id="name"
                placeholder={t("namePlaceholder")}
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
                if (!value) return t("monthRequired")
              },
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel>{t("month")}</FieldLabel>
                <Select value={field.state.value} onValueChange={(v) => field.handleChange(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("selectMonth")} />
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
                if (!value) return t("yearRequired")
              },
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel>{t("year")}</FieldLabel>
                <Select value={field.state.value} onValueChange={(v) => field.handleChange(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("selectYear")} />
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
              <FieldLabel htmlFor="description">{t("description")} <span className="text-muted-foreground">{tCommon("optional")}</span></FieldLabel>
              <Input
                id="description"
                placeholder={t("descriptionPlaceholder")}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
            </Field>
          )}
        </form.Field>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("creating") : t("createBudget")}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </FieldGroup>
    </form>
  )
}
