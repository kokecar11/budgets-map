"use client"

import React from "react"
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
import { useTranslations } from "next-intl"
import { categoryApi } from "./api"
import type { Category, CategoryCreate } from "./types"

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
  "#64748b", "#78716c", "#0ea5e9", "#a855f7",
]

const EXPENSE_ICONS = [
  "🛒", "🍔", "🍕", "☕", "🚗", "⛽", "🏠", "💡",
  "💊", "🎬", "🎮", "👗", "✈️", "🏋️", "📱", "🐾",
  "📚", "🎓", "🛡️", "💈", "🎁", "🍺", "🧴", "🔧",
]

const INCOME_ICONS = [
  "💰", "💵", "🏦", "📈", "💼", "🧾", "🎯", "🏆",
  "💹", "🤝", "🏗️", "📊", "💻", "🎨", "✍️", "🎤",
]

interface CategoryFormProps {
  initialValues?: Category
  onSuccess: (category: Category) => void
  onCancel: () => void
}

export function CategoryForm({ initialValues, onSuccess, onCancel }: CategoryFormProps) {
  const { data: session } = useSession()
  const t = useTranslations("categories")
  const tCommon = useTranslations("common")
  const isEditing = !!initialValues

  const form = useForm({
    defaultValues: {
      name: initialValues?.name ?? "",
      type: (initialValues?.type ?? "expense") as CategoryCreate["type"],
      icon: initialValues?.icon ?? "",
      color: initialValues?.color ?? "",
    },
    onSubmit: async ({ value }) => {
      try {
        let category: Category
        if (isEditing) {
          category = await categoryApi.update(initialValues.id, {
            name: value.name,
            type: value.type,
            icon: value.icon || undefined,
            color: value.color || undefined,
          }, session?.accessToken ?? "")
          toast.success(t("categoryUpdated"))
        } else {
          category = await categoryApi.create({
            name: value.name,
            type: value.type,
            icon: value.icon || undefined,
            color: value.color || undefined,
          }, session?.accessToken ?? "")
          toast.success(t("categoryCreated"))
        }
        onSuccess(category)
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
        {/* Name */}
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

        {/* Type */}
        <form.Field name="type">
          {(field) => (
            <Field>
              <FieldLabel>{t("type")}</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as CategoryCreate["type"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("selectType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">{t("typeExpense")}</SelectItem>
                  <SelectItem value="income">{t("typeIncome")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        {/* Icon picker */}
        <form.Subscribe selector={(s) => s.values.type}>
          {(type) => (
            <form.Field name="icon">
              {(field) => (
                <Field>
                  <FieldLabel>
                    {t("icon")} <span className="text-muted-foreground">{tCommon("optional")}</span>
                  </FieldLabel>
                  <div className="grid grid-cols-8 gap-1.5 p-3 rounded-lg border bg-muted/30">
                    {(type === "income" ? INCOME_ICONS : EXPENSE_ICONS).map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => field.handleChange(field.state.value === emoji ? "" : emoji)}
                        className={`flex items-center justify-center size-9 rounded-md text-lg transition-colors hover:bg-muted ${
                          field.state.value === emoji
                            ? "bg-primary/15 ring-2 ring-primary"
                            : ""
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  {field.state.value && (
                    <p className="text-xs text-muted-foreground">
                      {t("iconSelected", { icon: field.state.value })}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>
          )}
        </form.Subscribe>

        {/* Color picker */}
        <form.Field name="color">
          {(field) => (
            <Field>
              <FieldLabel>
                {t("color")} <span className="text-muted-foreground">{tCommon("optional")}</span>
              </FieldLabel>
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-6 gap-2 p-3 rounded-lg border bg-muted/30">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => field.handleChange(field.state.value === color ? "" : color)}
                      className={`size-8 rounded-md bg-(--sw) transition-transform hover:scale-110 ${
                        field.state.value === color
                          ? "ring-2 ring-offset-2 ring-primary scale-110"
                          : ""
                      }`}
                      style={{ "--sw": color } as React.CSSProperties}
                      title={color}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="size-8 rounded-md border shrink-0 bg-(--sw)"
                    style={{ "--sw": field.state.value || "transparent" } as React.CSSProperties}
                  />
                  <Input
                    placeholder={t("customColor")}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </Field>
          )}
        </form.Field>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditing ? t("saving") : t("creating")
                  : isEditing ? t("saveChanges") : t("createCategory")}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </FieldGroup>
    </form>
  )
}
