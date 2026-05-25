"use client"

import { useEffect, useState } from "react"
import { signIn } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Link } from "@/i18n/navigation"
import { useForm } from "@tanstack/react-form"

import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

type State = "loading" | "idle" | "submitting" | "error"

interface Tokens {
  access_token: string
  refresh_token: string
}

export function ResetPasswordClient() {
  const router = useRouter()
  const t = useTranslations("auth")
  const [state, setState] = useState<State>("loading")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [tokens, setTokens] = useState<Tokens | null>(null)

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get("access_token")
    const refreshToken = params.get("refresh_token")
    const type = params.get("type")

    if (!accessToken || !refreshToken || type !== "recovery") {
      setErrorMessage(t("resetLinkExpired"))
      setState("error")
      return
    }

    setTokens({ access_token: accessToken, refresh_token: refreshToken })
    setState("idle")
  }, [t])

  const form = useForm({
    defaultValues: {
      new_password: "",
      confirm_new_password: "",
    },
    onSubmit: async ({ value }) => {
      if (!tokens) return
      setState("submitting")
      const result = await signIn("reset-password", {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        new_password: value.new_password,
        redirect: false,
      })
      if (result?.ok) {
        router.replace("/dashboard")
      } else if (result?.error === "EXPIRED_OR_INVALID_TOKEN") {
        setErrorMessage(t("resetLinkExpired"))
        setState("error")
      } else {
        setErrorMessage(result?.error ?? t("unexpectedError"))
        setState("error")
      }
    },
  })

  if (state === "loading") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6" />
    )
  }

  if (state === "error") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
        <div className="w-full max-w-sm space-y-4 text-center">
          <p className="text-destructive text-sm font-medium">{errorMessage}</p>
          <Link
            href="/forgot-password"
            className="text-sm underline underline-offset-4 hover:text-primary"
          >
            {t("requestNewLink")}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold">{t("resetPasswordTitle")}</h1>
              <p className="text-balance text-muted-foreground">
                {t("resetPasswordSubtitle")}
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
                  name="new_password"
                  validators={{
                    onSubmit: ({ value }) => {
                      if (!value) return t("newPasswordRequired")
                      if (value.length < 8) return t("newPasswordMin")
                    },
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor="new_password">
                        {t("newPassword")}
                      </FieldLabel>
                      <Input
                        id="new_password"
                        type="password"
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

                <form.Field
                  name="confirm_new_password"
                  validators={{
                    onSubmit: ({ value, fieldApi }) => {
                      if (!value) return t("confirmNewPasswordRequired")
                      if (value !== fieldApi.form.getFieldValue("new_password"))
                        return t("newPasswordMismatch")
                    },
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor="confirm_new_password">
                        {t("confirmNewPassword")}
                      </FieldLabel>
                      <Input
                        id="confirm_new_password"
                        type="password"
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
                      <Button
                        type="submit"
                        disabled={isSubmitting || state === "submitting"}
                      >
                        {isSubmitting || state === "submitting"
                          ? t("updatingPassword")
                          : t("updatePassword")}
                      </Button>
                    </Field>
                  )}
                </form.Subscribe>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
