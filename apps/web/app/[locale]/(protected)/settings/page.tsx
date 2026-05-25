"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { Sun, Moon, Monitor } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { SearchSelect } from "@workspace/ui/components/search-select"
import { apiFetch } from "@/lib/api"
import { LanguageSwitcher } from "@/components/language-switcher"

const CURRENCIES = [
  { value: "COP", label: "COP — Peso colombiano" },
  { value: "USD", label: "USD — Dólar americano" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "MXN", label: "MXN — Peso mexicano" },
  { value: "BRL", label: "BRL — Real brasileño" },
  { value: "ARS", label: "ARS — Peso argentino" },
  { value: "PEN", label: "PEN — Sol peruano" },
  { value: "CLP", label: "CLP — Peso chileno" },
]

export default function SettingsGeneralPage() {
  const { data: session, update: updateSession } = useSession()
  const { theme, setTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const t = useTranslations("settings")

  const modeOptions = [
    { value: "light",  label: t("light"),  icon: Sun },
    { value: "dark",   label: t("dark"),   icon: Moon },
    { value: "system", label: t("system"), icon: Monitor },
  ]

  const form = useForm({
    defaultValues: {
      name: session?.user?.name ?? "",
      currency: session?.user?.currency ?? "COP",
    },
    onSubmit: async ({ value }) => {
      if (!session?.accessToken || !session?.user?.id) return
      setSaving(true)
      try {
        await apiFetch(`/api/v1/users/${session.user.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: value.name, currency: value.currency }),
          token: session.accessToken,
        })
        await updateSession({
          user: { name: value.name, currency: value.currency },
        })
        toast.success(t("profileUpdated"))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("errorSaving"))
      } finally {
        setSaving(false)
      }
    },
  })

  return (
    <>
      {/* Profile */}
      <div>
        <h2 className="text-base font-semibold mb-4">{t("profile")}</h2>
        <div className="rounded-xl border bg-card overflow-hidden">
          <form
            className="px-6 py-5"
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
                    !value.trim() ? t("nameRequired") : undefined,
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
                      <p className="text-destructive text-sm">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </Field>
                )}
              </form.Field>

              <Field>
                <FieldLabel>{t("email")}</FieldLabel>
                <Input
                  value={session?.user?.email ?? ""}
                  disabled
                  className="opacity-60"
                />
              </Field>

              <form.Field name="currency">
                {(field) => (
                  <Field>
                    <FieldLabel>{t("currency")}</FieldLabel>
                    <SearchSelect
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                      options={CURRENCIES}
                      placeholder={t("selectCurrency")}
                      searchPlaceholder={t("searchCurrency")}
                    />
                  </Field>
                )}
              </form.Field>

              <div className="flex justify-end pt-1">
                <Button type="submit" disabled={saving}>
                  {saving ? t("saving") : t("saveChanges")}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </div>
      </div>

      {/* Appearance */}
      <div>
        <h2 className="text-base font-semibold mb-4">{t("appearance")}</h2>
        <div className="rounded-xl border bg-card px-6 py-5 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{t("colorMode")}</p>
            <div className="flex gap-2 flex-wrap">
              {modeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors
                    ${
                      theme === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                    }`}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Language */}
      <div>
        <h2 className="text-base font-semibold mb-4">{t("language")}</h2>
        <div className="rounded-xl border bg-card px-6 py-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t("language")}</p>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </>
  )
}
