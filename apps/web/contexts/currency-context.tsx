"use client"

import React, { createContext, useContext } from "react"
import { useSession } from "next-auth/react"

interface CurrencyContextValue {
  currency: string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({
  initialCurrency,
  children,
}: {
  initialCurrency: string
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const currency = session?.user?.currency ?? initialCurrency

  return (
    <CurrencyContext.Provider value={{ currency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrencyContext(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error("useCurrencyContext must be used inside CurrencyProvider")
  return ctx
}
