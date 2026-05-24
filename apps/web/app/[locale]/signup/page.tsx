import type { Metadata } from "next"
import { SignupForm } from "@/features/signup/signup-form"

export const metadata: Metadata = {
  title: "Crear cuenta — Budgets Map",
}

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupForm />
      </div>
    </div>
  )
}
