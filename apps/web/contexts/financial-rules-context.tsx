"use client"

import React, { createContext, useContext, useState } from "react"
import type { FinancialRules } from "@/features/financial-rules/types"

interface FinancialRulesContextValue {
  rules: FinancialRules
  setRules: (rules: FinancialRules) => void
}

const FinancialRulesContext = createContext<FinancialRulesContextValue | null>(null)

export function FinancialRulesProvider({
  initialRules,
  children,
}: {
  initialRules: FinancialRules
  children: React.ReactNode
}) {
  const [rules, setRules] = useState<FinancialRules>(initialRules)

  return (
    <FinancialRulesContext.Provider value={{ rules, setRules }}>
      {children}
    </FinancialRulesContext.Provider>
  )
}

export function useFinancialRules(): FinancialRulesContextValue {
  const ctx = useContext(FinancialRulesContext)
  if (!ctx) throw new Error("useFinancialRules must be used inside FinancialRulesProvider")
  return ctx
}
