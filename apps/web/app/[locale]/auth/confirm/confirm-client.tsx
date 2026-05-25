"use client"

import { signIn } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Link } from "@/i18n/navigation"

interface ConfirmClientProps {
  token_hash: string | undefined
  type: string | undefined
}

export function ConfirmClient({ token_hash, type }: ConfirmClientProps) {
  const router = useRouter()
  const called = useRef(false)
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const t = useTranslations("auth")

  useEffect(() => {
    if (called.current) return
    called.current = true

    if (!token_hash || !type) {
      setErrorMessage(t("invalidLink"))
      setStatus("error")
      return
    }

    signIn("confirm", { token_hash, type, redirect: false })
      .then((result) => {
        if (result?.ok) {
          setStatus("success")
        } else {
          setErrorMessage(result?.error ?? t("confirmFailed"))
          setStatus("error")
        }
      })
      .catch(() => {
        setErrorMessage(t("unexpectedError"))
        setStatus("error")
      })
  }, [token_hash, type, t])

  useEffect(() => {
    if (status === "success") {
      router.replace("/dashboard")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
        <p className="text-muted-foreground text-sm">{t("confirmingAccount")}</p>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
        <p className="text-sm font-medium">{t("accountConfirmed")}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <p className="text-destructive text-sm font-medium">
          {errorMessage || t("couldNotConfirm")}
        </p>
        <Link
          href="/login"
          className="text-sm underline underline-offset-4 hover:text-primary"
        >
          {t("backToLogin")}
        </Link>
      </div>
    </div>
  )
}
