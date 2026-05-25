"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "@tanstack/react-form"

import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { apiFetch } from "@/lib/api"
import { useTranslations } from "next-intl"

const CURRENCY_OPTIONS = [
  { value: "COP", label: "COP — Peso colombiano" },
  { value: "USD", label: "USD — Dólar estadounidense" },
  { value: "MXN", label: "MXN — Peso mexicano" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "ARS", label: "ARS — Peso argentino" },
  { value: "CLP", label: "CLP — Peso chileno" },
  { value: "BRL", label: "BRL — Real brasileño" },
  { value: "PEN", label: "PEN — Sol peruano" },
]

export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const t = useTranslations("auth")
  const [serverError, setServerError] = useState<string | null>(null)
  const [requiresConfirmation, setRequiresConfirmation] = useState(false)

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      currency: "COP",
    },
    onSubmit: async ({ value }) => {
      setServerError(null)
      try {
        const res = await apiFetch<{ requires_confirmation: boolean }>(
          "/api/v1/auth/signup",
          {
            method: "POST",
            body: JSON.stringify({
              name: value.name,
              email: value.email,
              password: value.password,
              currency: value.currency,
            }),
          }
        )

        if (res.requires_confirmation) {
          setRequiresConfirmation(true)
          return
        }

        // Auto sign-in after successful registration
        const result = await signIn("credentials", {
          email: value.email,
          password: value.password,
          redirect: false,
        })
        if (result?.error) {
          setServerError(t("accountCreated"))
          router.push("/login")
        } else {
          router.push("/dashboard")
        }
      } catch (err) {
        setServerError(err instanceof Error ? err.message : t("unexpectedError"))
      }
    },
  })

  if (requiresConfirmation) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="flex items-center justify-center size-12 rounded-full bg-primary/10">
              <svg className="size-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">{t("checkEmail")}</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              {t("confirmationSent")}
            </p>
            <Button variant="outline" onClick={() => router.push("/login")}>
              {t("goToLogin")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            className="p-6 md:p-8"
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">{t("createAccount")}</h1>
                <p className="text-balance text-muted-foreground text-sm">
                  {t("signupSubtitle")}
                </p>
              </div>

              {/* Name */}
              <form.Field
                name="name"
                validators={{
                  onSubmit: ({ value }) => !value.trim() ? t("nameRequired") : undefined,
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

              {/* Email */}
              <form.Field
                name="email"
                validators={{
                  onSubmit: ({ value }) => {
                    if (!value) return t("emailRequiredSignup")
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t("emailInvalidSignup")
                  },
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("emailPlaceholder")}
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

              {/* Password */}
              <form.Field
                name="password"
                validators={{
                  onSubmit: ({ value }) => {
                    if (!value) return t("passwordRequired8")
                    if (value.length < 8) return t("minChars")
                  },
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="password">{t("passwordSignup")}</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      placeholder={t("passwordPlaceholder")}
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

              {/* Confirm password */}
              <form.Subscribe selector={(s) => s.values.password}>
                {(password) => (
                  <form.Field
                    name="confirmPassword"
                    validators={{
                      onSubmit: ({ value }) => {
                        if (!value) return t("confirmPasswordRequired")
                        if (value !== password) return t("passwordMismatch")
                      },
                    }}
                  >
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor="confirmPassword">{t("confirmPassword")}</FieldLabel>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder={t("confirmPasswordPlaceholder")}
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
                )}
              </form.Subscribe>

              {/* Currency */}
              <form.Field name="currency">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="currency">{t("mainCurrency")}</FieldLabel>
                    <select
                      id="currency"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </Field>
                )}
              </form.Field>

              {serverError && (
                <p className="text-destructive text-sm text-center">{serverError}</p>
              )}

              <form.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <Field>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? t("creatingAccount") : t("createFree")}
                    </Button>
                  </Field>
                )}
              </form.Subscribe>

              <FieldDescription className="text-center">
                {t("alreadyHaveAccount")}{" "}
                <a href="/login" className="underline underline-offset-2 hover:text-foreground">
                  {t("signIn")}
                </a>
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="relative hidden bg-muted md:block">
            <img
              src="/images/login-image.png"
              alt="Budgets Map"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        {t("termsNoticeSignup")}{" "}
        <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">{t("termsAndPrivacy")}</a>.
      </FieldDescription>
    </div>
  )
}
