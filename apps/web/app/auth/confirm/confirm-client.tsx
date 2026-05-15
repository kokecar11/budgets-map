"use client"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

interface ConfirmClientProps {
  token_hash: string | undefined
  type: string | undefined
}

export function ConfirmClient({ token_hash, type }: ConfirmClientProps) {
  const router = useRouter()
  const called = useRef(false)
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading")
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    if (called.current) return
    called.current = true

    if (!token_hash || !type) {
      setErrorMessage("Enlace de confirmación inválido. Faltan parámetros requeridos.")
      setStatus("error")
      return
    }

    signIn("confirm", { token_hash, type, redirect: false })
      .then((result) => {
        if (result?.ok) {
          setStatus("success")
        } else {
          setErrorMessage(result?.error ?? "La confirmación falló. El enlace puede haber expirado o ya fue usado.")
          setStatus("error")
        }
      })
      .catch(() => {
        setErrorMessage("Ocurrió un error inesperado. Intenta de nuevo.")
        setStatus("error")
      })
  }, [token_hash, type])

  useEffect(() => {
    if (status === "success") {
      router.replace("/dashboard")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
        <p className="text-muted-foreground text-sm">Confirmando tu cuenta...</p>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
        <p className="text-sm font-medium">¡Cuenta confirmada! Redirigiendo...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <p className="text-destructive text-sm font-medium">
          {errorMessage || "No se pudo confirmar tu cuenta."}
        </p>
        <a
          href="/login"
          className="text-sm underline underline-offset-4 hover:text-primary"
        >
          Volver al inicio de sesión
        </a>
      </div>
    </div>
  )
}
