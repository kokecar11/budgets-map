import { useLocale } from "next-intl"
import { useCurrencyContext } from "@/contexts/currency-context"
import { formatCurrency } from "@/lib/format"
import type { Locale } from "@/i18n/routing"

export function useCurrency(): (amount: number) => string {
  const locale = useLocale() as Locale
  const { currency } = useCurrencyContext()
  return (amount: number) => formatCurrency(amount, locale, currency)
}
