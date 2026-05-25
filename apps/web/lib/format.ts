import type { Locale } from "@/i18n/routing"

const LOCALE_TAG: Record<Locale, string> = {
  en: "en-US",
  es: "es-MX",
}

export function formatCurrency(
  amount: number,
  locale: Locale,
  currency = "MXN",
): string {
  return new Intl.NumberFormat(LOCALE_TAG[locale], {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
