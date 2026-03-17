"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { Sun, Moon, Monitor } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { SearchSelect } from "@workspace/ui/components/search-select"
import { ThemeSelector } from "@workspace/ui/components/theme-selector"
import { apiFetch } from "@/lib/api"

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

const MODE_OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
]

export default function SettingsGeneralPage() {
  const { data: session, update: updateSession } = useSession()
  const { theme, setTheme } = useTheme()
  const [saving, setSaving] = useState(false)

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
        toast.success("Perfil actualizado")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al guardar")
      } finally {
        setSaving(false)
      }
    },
  })

  return (
    <>
      {/* ── Perfil ── */}
      <div>
        <h2 className="text-base font-semibold mb-4">Perfil</h2>
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
                    !value.trim() ? "El nombre es requerido" : undefined,
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="name">Nombre</FieldLabel>
                    <Input
                      id="name"
                      placeholder="Tu nombre"
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
                <FieldLabel>Email</FieldLabel>
                <Input
                  value={session?.user?.email ?? ""}
                  disabled
                  className="opacity-60"
                />
              </Field>

              <form.Field name="currency">
                {(field) => (
                  <Field>
                    <FieldLabel>Moneda</FieldLabel>
                    <SearchSelect
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                      options={CURRENCIES}
                      placeholder="Seleccionar moneda"
                      searchPlaceholder="Buscar moneda..."
                    />
                  </Field>
                )}
              </form.Field>

              <div className="flex justify-end pt-1">
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando…" : "Guardar cambios"}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </div>
      </div>

      {/* ── Apariencia ── */}
      <div>
        <h2 className="text-base font-semibold mb-4">Apariencia</h2>
        <div className="rounded-xl border bg-card px-6 py-5 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Modo de color</p>
            <div className="flex gap-2 flex-wrap">
              {MODE_OPTIONS.map(({ value, label, icon: Icon }) => (
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

          {/* <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Tema de color</p>
            <ThemeSelector />
          </div> */}
        </div>
      </div>
    </>
  )
}
