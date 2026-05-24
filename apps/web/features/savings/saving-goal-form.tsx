"use client"

import { useSession } from "next-auth/react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { DatePicker } from "@workspace/ui/components/date-picker"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { useTranslations } from "next-intl"
import { savingGoalApi } from "./api"
import type { SavingGoal, SavingGoalCreate, SavingGoalUpdate } from "./types"

interface SavingGoalFormProps {
  onSuccess: (goal: SavingGoal) => void
  onCancel: () => void
  initialValues?: SavingGoal
}

export function SavingGoalForm({ onSuccess, onCancel, initialValues }: SavingGoalFormProps) {
  const { data: session } = useSession()
  const t = useTranslations("savings")
  const tCommon = useTranslations("common")
  const isEdit = Boolean(initialValues)

  const form = useForm({
    defaultValues: {
      name: initialValues?.name ?? "",
      target_amount: initialValues?.target_amount?.toString() ?? "",
      deadline: initialValues?.deadline?.split("T")[0] ?? "",
      description: initialValues?.description ?? "",
    },
    onSubmit: async ({ value }) => {
      try {
        const token = session?.accessToken ?? ""
        let goal: SavingGoal
        if (isEdit && initialValues) {
          const payload: SavingGoalUpdate = {
            name: value.name,
            target_amount: Number(value.target_amount),
            deadline: value.deadline || undefined,
            description: value.description || undefined,
          }
          goal = await savingGoalApi.update(initialValues.id, payload, token)
          toast.success(t("goalUpdated"))
        } else {
          const payload: SavingGoalCreate = {
            name: value.name,
            target_amount: Number(value.target_amount),
            deadline: value.deadline || undefined,
            description: value.description || undefined,
          }
          goal = await savingGoalApi.create(payload, token)
          toast.success(t("goalCreated"))
        }
        onSuccess(goal)
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
          name="name"
          validators={{ onSubmit: ({ value }) => !value.trim() ? t("nameRequired") : undefined }}
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

        <form.Field
          name="target_amount"
          validators={{ onSubmit: ({ value }) => !value || Number(value) <= 0 ? t("amountRequired") : undefined }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor="target_amount">{t("targetAmount")}</FieldLabel>
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
              <FieldLabel>{t("deadlineField")} <span className="text-muted-foreground">{tCommon("optional")}</span></FieldLabel>
              <DatePicker
                value={field.state.value ?? ""}
                onChange={field.handleChange}
                placeholder={t("noDeadline")}
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="description">{t("descriptionField")} <span className="text-muted-foreground">{tCommon("optional")}</span></FieldLabel>
              <Input
                id="description"
                placeholder={t("descriptionPlaceholder")}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
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
                {isSubmitting ? tCommon("saving") : isEdit ? t("saveChanges") : t("createGoal")}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </FieldGroup>
    </form>
  )
}
