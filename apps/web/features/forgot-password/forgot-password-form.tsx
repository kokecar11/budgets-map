"use client"

import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useTranslations } from "next-intl"

import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Link } from "@/i18n/navigation"
import { apiFetch } from "@/lib/api"

type State = "idle" | "sending" | "sent"

export function ForgotPasswordForm() {
  const t = useTranslations("auth")
  const [state, setState] = useState<State>("idle")

  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      setState("sending")
      try {
        await apiFetch("/api/v1/auth/forgot-password", {
          method: "POST",
          body: JSON.stringify({
            email: value.email,
            redirect_to: window.location.origin + "/auth/reset-password",
          }),
        })
      } catch {
        // Anti-enumeration: always transition to sent, hide network errors
      }
      setState("sent")
    },
  })

  if (state === "sent") {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">{t("resetEmailSent")}</h1>
            <p className="text-balance text-muted-foreground">
              {t("resetEmailSentDesc")}
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link
            href="/login"
            className="text-sm underline underline-offset-2 hover:text-foreground"
          >
            {t("backToLogin")}
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">{t("forgotPasswordTitle")}</h1>
          <p className="text-balance text-muted-foreground">
            {t("forgotPasswordSubtitle")}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field
              name="email"
              validators={{
                onSubmit: ({ value }) => {
                  if (!value) return t("emailRequired")
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                    return t("emailInvalid")
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
                    <p className="text-destructive text-sm">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Field>
                  <Button type="submit" disabled={isSubmitting || state === "sending"}>
                    {isSubmitting || state === "sending"
                      ? t("sendingResetLink")
                      : t("sendResetLink")}
                  </Button>
                </Field>
              )}
            </form.Subscribe>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm underline underline-offset-2 hover:text-foreground"
              >
                {t("backToLogin")}
              </Link>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
